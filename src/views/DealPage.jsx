import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { STAGES, STAGE_COLORS, SECTORS } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'
import DealModal from '../components/DealModal'

// ─── Shared styles ──────────────────────────────────────────────────────────
const card = { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
const sectionLabel = { fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', display: 'block' }
const inputStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e5e5e5', fontSize: '12px', padding: '7px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
const addBtn = { background: 'none', border: '1px dashed #2a2a2a', borderRadius: '6px', color: '#555', cursor: 'pointer', fontSize: '12px', padding: '7px 12px', width: '100%', textAlign: 'left', fontFamily: 'inherit', marginTop: '8px' }
const iconBtn = { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit' }
const metaKey = { color: '#555', fontSize: '12px' }
const metaVal = { color: '#ccc', fontSize: '12px', fontWeight: 500 }

// ─── Star Rating ─────────────────────────────────────────────────────────────
function Stars({ value = 0, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n === value ? 0 : n)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: n <= value ? '#facc15' : '#2a2a2a', fontSize: '18px', padding: '0 1px', lineHeight: 1 }}>
          ★
        </button>
      ))}
    </div>
  )
}

// ─── Activity icon map ───────────────────────────────────────────────────────
const ACT_ICONS = { call: '📞', email: '✉️', meeting: '👥', note: '📝' }

export default function DealPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const fileInputRef = useRef(null)
  const memoTimer = useRef(null)

  // Local editable state
  const [memo, setMemo] = useState('')
  const [metrics, setMetrics] = useState({})
  const [score, setScore] = useState({})
  const [tasks, setTasks] = useState([])
  const [activity, setActivity] = useState([])
  const [buyers, setBuyers] = useState([])
  const [contacts, setContacts] = useState([])
  const [coInvestors, setCoInvestors] = useState([])
  const [documents, setDocuments] = useState([])
  const [timeline, setTimeline] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newActivity, setNewActivity] = useState({ type: 'call', note: '' })
  const [newBuyer, setNewBuyer] = useState('')
  const [newCoInv, setNewCoInv] = useState({ name: '', firm: '', committed: '' })
  const [aiLoading, setAiLoading] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)            // PDF viewer
  const [emailPanel, setEmailPanel] = useState(false)     // email composer
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [buyerUniverse, setBuyerUniverse] = useState([])  // PitchBook buyer universe
  const [buyerLoading, setBuyerLoading] = useState(false)

  // Fetch deal
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('deals').select('*').eq('id', id).single()
      if (error || !data) { navigate('/'); return }
      setDeal(data)
      setMemo(data.memo || '')
      setMetrics(data.metrics || {})
      setScore(data.score || {})
      setTasks(data.tasks || [])
      setActivity(data.activity_log || [])
      setBuyers(data.buyers || [])
      setContacts(data.contacts || [])
      setCoInvestors(data.co_investors || [])
      setDocuments(data.documents || [])
      setTimeline(data.timeline_to_close || '')
      setLoading(false)
    }
    load()
  }, [id])

  const save = useCallback(async (updates) => {
    setSaving(true)
    const { data } = await supabase.from('deals').update(updates).eq('id', id).select().single()
    if (data) setDeal(data)
    setSaving(false)
  }, [id])

  // Memo auto-save
  const handleMemoChange = (val) => {
    setMemo(val)
    clearTimeout(memoTimer.current)
    memoTimer.current = setTimeout(() => save({ memo: val }), 1000)
  }

  // Metrics save on blur
  const handleMetricBlur = () => save({ metrics })

  // Score
  const handleScore = (key, val) => {
    const next = { ...score, [key]: val }
    setScore(next)
    save({ score: next })
  }

  // Tasks
  const addTask = () => {
    if (!newTask.trim()) return
    const next = [...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false, due: '' }]
    setTasks(next); setNewTask(''); save({ tasks: next })
  }
  const toggleTask = (tid) => {
    const next = tasks.map(t => t.id === tid ? { ...t, done: !t.done } : t)
    setTasks(next); save({ tasks: next })
  }
  const removeTask = (tid) => {
    const next = tasks.filter(t => t.id !== tid)
    setTasks(next); save({ tasks: next })
  }
  const updateTaskDue = (tid, due) => {
    const next = tasks.map(t => t.id === tid ? { ...t, due } : t)
    setTasks(next); save({ tasks: next })
  }

  // Activity log
  const addActivity = () => {
    if (!newActivity.note.trim()) return
    const next = [{ id: crypto.randomUUID(), type: newActivity.type, note: newActivity.note.trim(), date: new Date().toISOString() }, ...activity]
    setActivity(next); setNewActivity({ type: 'call', note: '' }); save({ activity_log: next })
  }
  const removeActivity = (aid) => {
    const next = activity.filter(a => a.id !== aid)
    setActivity(next); save({ activity_log: next })
  }

  // Buyers
  const addBuyer = () => {
    if (!newBuyer.trim()) return
    const next = [...buyers, { id: crypto.randomUUID(), name: newBuyer.trim(), status: 'Active' }]
    setBuyers(next); setNewBuyer(''); save({ buyers: next })
  }
  const toggleBuyer = (bid) => {
    const next = buyers.map(b => b.id === bid ? { ...b, status: b.status === 'Active' ? 'Passed' : 'Active' } : b)
    setBuyers(next); save({ buyers: next })
  }
  const removeBuyer = (bid) => {
    const next = buyers.filter(b => b.id !== bid)
    setBuyers(next); save({ buyers: next })
  }

  // Co-investors
  const addCoInvestor = () => {
    if (!newCoInv.name.trim()) return
    const next = [...coInvestors, { id: crypto.randomUUID(), ...newCoInv }]
    setCoInvestors(next); setNewCoInv({ name: '', firm: '', committed: '' }); save({ co_investors: next })
  }
  const removeCoInvestor = (cid) => {
    const next = coInvestors.filter(c => c.id !== cid)
    setCoInvestors(next); save({ co_investors: next })
  }

  // Contacts
  const addContact = () => {
    const next = [...contacts, { id: crypto.randomUUID(), firm: '', name: '', email: '', notes: '' }]
    setContacts(next)
  }
  const updateContact = (cid, field, val) => {
    const next = contacts.map(c => c.id === cid ? { ...c, [field]: val } : c)
    setContacts(next)
  }
  const saveContacts = () => save({ contacts })
  const removeContact = (cid) => {
    const next = contacts.filter(c => c.id !== cid)
    setContacts(next); save({ contacts: next })
  }
  const generateContacts = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ deal }) })
      const data = await res.json()
      if (data.contacts) {
        const withIds = data.contacts.map(c => ({ ...c, id: crypto.randomUUID() }))
        const next = [...contacts, ...withIds]
        setContacts(next); save({ contacts: next })
      }
    } catch { }
    setAiLoading(false)
  }

  // Timeline
  const handleTimeline = (val) => {
    setTimeline(val); save({ timeline_to_close: val || null })
  }

  // File upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSaving(true)
    const path = `${id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('deal-files').upload(path, file)
    if (error) { alert('Upload failed: ' + error.message); setSaving(false); return }
    const { data: { publicUrl } } = supabase.storage.from('deal-files').getPublicUrl(path)
    const newDoc = { id: crypto.randomUUID(), name: file.name, url: publicUrl, size: file.size, type: file.type, uploaded_at: new Date().toISOString() }
    const next = [...documents, newDoc]
    setDocuments(next); save({ documents: next })
    e.target.value = ''
  }
  const removeDocument = (did) => {
    const next = documents.filter(d => d.id !== did)
    setDocuments(next); save({ documents: next })
  }

  // Edit modal save
  const handleEditSave = async (data) => {
    const { data: updated } = await supabase.from('deals').update(data).eq('id', id).select().single()
    if (updated) setDeal(updated)
    setShowEditModal(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this deal?')) return
    await supabase.from('deals').delete().eq('id', id)
    navigate('/')
  }

  const findBuyers = async () => {
    setBuyerLoading(true)
    try {
      const res = await fetch('/api/find-buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: { ...deal, memo } }),
      })
      const data = await res.json()
      if (data.buyers) setBuyerUniverse(data.buyers)
    } catch { }
    setBuyerLoading(false)
  }

  const generateEmail = async () => {
    setEmailLoading(true)
    setEmailPanel(true)
    try {
      const res = await fetch('/api/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: { ...deal, memo } }),
      })
      const data = await res.json()
      if (data.subject) setEmailSubject(data.subject)
      if (data.body) setEmailBody(data.body)
    } catch { }
    setEmailLoading(false)
  }

  const openMailto = () => {
    const emailList = contacts.filter(c => c.email).map(c => c.email).join(',')
    const mailto = `mailto:${emailList}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`
    window.open(mailto, '_blank')
  }

  const copyEmailBody = () => {
    navigator.clipboard.writeText(`Subject: ${emailSubject}\n\n${emailBody}`)
    setEmailCopied(true)
    setTimeout(() => setEmailCopied(false), 2000)
  }

  const avgScore = () => {
    const vals = Object.values(score).filter(v => v > 0)
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null
  }

  const fmtSize = (b) => b > 1e6 ? `${(b / 1e6).toFixed(1)}MB` : `${(b / 1e3).toFixed(0)}KB`

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px' }}>
      Loading...
    </div>
  )

  if (!deal) return null
  const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      {/* ── Top nav ── */}
      <nav style={{ height: '52px', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', position: 'sticky', top: 0, zIndex: 40 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ← Back
        </button>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: '#f0f0f0', flex: 1 }}>
          {deal.company_name}
        </span>
        {saving && <span style={{ color: '#444', fontSize: '11px' }}>Saving…</span>}
        <button onClick={() => setShowEditModal(true)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Edit</button>
        <button onClick={handleDelete} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#f87171', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Delete</button>
        <UserButton afterSignOutUrl="/" />
      </nav>

      {/* ── Page header ── */}
      <div style={{ padding: '28px 32px 0', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#f0f0f0', margin: 0 }}>{deal.company_name}</h1>
          <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '5px', padding: '3px 12px', fontSize: '11px' }}>{deal.stage}</span>
          {deal.sector && <span style={{ color: '#555', fontSize: '12px' }}>{deal.sector}</span>}
          {deal.raise_amount && <span style={{ color: '#888', fontSize: '13px', marginLeft: 'auto' }}>{formatCurrency(deal.raise_amount)} raise</span>}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="deal-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '12px', padding: '0 32px 40px', maxWidth: '1300px', margin: '0 auto' }}>

        {/* ── LEFT COLUMN ── */}
        <div>

          {/* Investment Memo */}
          <div style={card}>
            <span style={sectionLabel}>Investment Memo</span>
            <textarea
              style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', lineHeight: 1.7 }}
              placeholder="Write your investment thesis, key observations, risks and opportunities..."
              value={memo}
              onChange={e => handleMemoChange(e.target.value)}
            />
          </div>

          {/* Key Metrics */}
          <div style={card}>
            <span style={sectionLabel}>Key Metrics</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { key: 'revenue', label: 'Revenue' },
                { key: 'ebitda', label: 'EBITDA' },
                { key: 'growth_rate', label: 'Growth Rate' },
                { key: 'burn_rate', label: 'Burn Rate / mo' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <div style={{ color: '#555', fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <input
                    style={inputStyle}
                    placeholder="—"
                    value={metrics[key] || ''}
                    onChange={e => setMetrics(m => ({ ...m, [key]: e.target.value }))}
                    onBlur={handleMetricBlur}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div style={card}>
            <span style={sectionLabel}>Activity Log</span>
            {/* Add entry */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <select
                value={newActivity.type}
                onChange={e => setNewActivity(a => ({ ...a, type: e.target.value }))}
                style={{ ...inputStyle, width: '100px', flexShrink: 0 }}
              >
                {Object.keys(ACT_ICONS).map(t => <option key={t} value={t}>{ACT_ICONS[t]} {t}</option>)}
              </select>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Add a note..."
                value={newActivity.note}
                onChange={e => setNewActivity(a => ({ ...a, note: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') addActivity() }}
              />
              <button onClick={addActivity} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0 }}>Log</button>
            </div>
            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {activity.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', gap: '12px', paddingBottom: '12px', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: '28px', height: '28px', background: '#1a1a1a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', border: '1px solid #2a2a2a' }}>
                      {ACT_ICONS[a.type] || '📝'}
                    </div>
                    {i < activity.length - 1 && <div style={{ width: '1px', flex: 1, background: '#1f1f1f', marginTop: '4px' }} />}
                  </div>
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ color: '#e5e5e5', fontSize: '12px', lineHeight: 1.5 }}>{a.note}</span>
                      <button style={iconBtn} onClick={() => removeActivity(a.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
                    </div>
                    <span style={{ color: '#444', fontSize: '10px' }}>{formatDate(a.date)} · {a.type}</span>
                  </div>
                </div>
              ))}
              {activity.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No activity logged yet</div>}
            </div>
          </div>

          {/* Tasks */}
          <div style={card}>
            <span style={sectionLabel}>Tasks & Next Steps</span>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder="Add a task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTask() }}
              />
              <button onClick={addTask} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0 }}>Add</button>
            </div>
            {tasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                <button onClick={() => toggleTask(t.id)} style={{ background: t.done ? '#7c6af7' : 'transparent', border: `1px solid ${t.done ? '#7c6af7' : '#333'}`, borderRadius: '4px', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px' }}>
                  {t.done ? '✓' : ''}
                </button>
                <span style={{ flex: 1, color: t.done ? '#444' : '#ccc', fontSize: '12px', textDecoration: t.done ? 'line-through' : 'none' }}>{t.text}</span>
                <input
                  type="date"
                  value={t.due || ''}
                  onChange={e => updateTaskDue(t.id, e.target.value)}
                  style={{ ...inputStyle, width: '130px', color: t.due ? '#888' : '#333' }}
                />
                <button style={iconBtn} onClick={() => removeTask(t.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
              </div>
            ))}
            {tasks.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No tasks yet</div>}
          </div>

          {/* Documents */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={sectionLabel}>Documents</span>
              <button onClick={() => fileInputRef.current?.click()} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                + Upload
              </button>
              <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>
            {documents.map(doc => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }}>
                <span style={{ fontSize: '18px' }}>{doc.type?.includes('pdf') ? '📄' : doc.type?.includes('image') ? '🖼️' : '📎'}</span>
                <span style={{ flex: 1, color: '#9d8fff', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                {doc.type?.includes('pdf') && (
                  <button onClick={() => setViewDoc(doc)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '5px', fontSize: '11px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>View</button>
                )}
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#444', fontSize: '11px', textDecoration: 'none', flexShrink: 0 }}>↗</a>
                <span style={{ color: '#333', fontSize: '11px', flexShrink: 0 }}>{fmtSize(doc.size)}</span>
                <button style={iconBtn} onClick={() => removeDocument(doc.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
              </div>
            ))}
            {documents.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No documents uploaded</div>}
          </div>

          {/* Buyer Universe */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <span style={sectionLabel}>Buyer Universe</span>
                <div style={{ color: '#444', fontSize: '11px', marginTop: '-10px' }}>AI-generated · opens PitchBook profile</div>
              </div>
              <button
                onClick={findBuyers}
                disabled={buyerLoading}
                style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                {buyerLoading ? 'Searching…' : buyerUniverse.length ? '↺ Refresh' : '✦ Find Buyers'}
              </button>
            </div>

            {buyerLoading && (
              <div style={{ color: '#555', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
                Analyzing deal profile and identifying buyers…
              </div>
            )}

            {!buyerLoading && buyerUniverse.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Type filter legend */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  {['PE', 'Strategic', 'Family Office', 'Growth Equity'].map(type => {
                    const count = buyerUniverse.filter(b => b.type === type).length
                    if (!count) return null
                    const colors = { PE: '#6366f1', Strategic: '#f59e0b', 'Family Office': '#10b981', 'Growth Equity': '#3b82f6' }
                    return (
                      <span key={type} style={{ fontSize: '10px', color: colors[type] || '#888' }}>
                        ● {type} ({count})
                      </span>
                    )
                  })}
                </div>

                {buyerUniverse.map((buyer, i) => {
                  const typeColors = { PE: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' }, Strategic: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }, 'Family Office': { bg: 'rgba(16,185,129,0.1)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }, 'Growth Equity': { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } }
                  const tc = typeColors[buyer.type] || { bg: 'rgba(255,255,255,0.05)', text: '#888', border: '#333' }
                  const pbUrl = `https://app.pitchbook.com/search?q=${encodeURIComponent(buyer.pitchbook_query || buyer.name)}`

                  return (
                    <div key={i} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0f0f0' }}>{buyer.name}</span>
                          <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, borderRadius: '4px', fontSize: '10px', padding: '1px 7px', flexShrink: 0 }}>{buyer.type}</span>
                        </div>
                        <div style={{ color: '#666', fontSize: '12px', lineHeight: 1.5 }}>{buyer.thesis}</div>
                      </div>
                      <a
                        href={pbUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on PitchBook"
                        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px', background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '6px', padding: '5px 10px', textDecoration: 'none', color: '#9d8fff', fontSize: '11px', whiteSpace: 'nowrap', marginTop: '2px' }}
                      >
                        PitchBook ↗
                      </a>
                    </div>
                  )
                })}
              </div>
            )}

            {!buyerLoading && buyerUniverse.length === 0 && (
              <div style={{ color: '#333', fontSize: '12px' }}>
                Click "Find Buyers" to generate a targeted buyer universe based on this deal's profile — PE firms, strategic acquirers, and family offices with active mandates in this sector and size range.
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>

          {/* Deal Info */}
          <div style={card}>
            <span style={sectionLabel}>Deal Info</span>
            {[
              { label: 'Raise', value: formatCurrency(deal.raise_amount) },
              { label: 'Valuation', value: formatCurrency(deal.valuation) },
              { label: 'Sector', value: deal.sector },
              { label: 'Owner', value: deal.deal_owner },
              { label: 'Added', value: formatDate(deal.created_at) },
            ].filter(r => r.value && r.value !== '—').map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={metaKey}>{r.label}</span>
                <span style={metaVal}>{r.value}</span>
              </div>
            ))}
            {deal.website && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={metaKey}>Website</span>
                <a href={deal.website} target="_blank" rel="noopener noreferrer" style={{ ...metaVal, color: '#9d8fff' }}>{deal.website}</a>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <div style={{ color: '#555', fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timeline to Close</div>
              <input type="date" style={inputStyle} value={timeline} onChange={e => handleTimeline(e.target.value)} />
            </div>
          </div>

          {/* Deal Score */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={sectionLabel}>Deal Score</span>
              {avgScore() && <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#facc15' }}>{avgScore()}<span style={{ fontSize: '12px', color: '#555' }}>/5</span></span>}
            </div>
            {[
              { key: 'team', label: 'Team' },
              { key: 'market', label: 'Market Size' },
              { key: 'traction', label: 'Traction' },
              { key: 'terms', label: 'Terms' },
            ].map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>{label}</span>
                <Stars value={score[key] || 0} onChange={val => handleScore(key, val)} />
              </div>
            ))}
          </div>

          {/* Buyers */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionLabel}>Buyers</span>
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px' }}>
                <span style={{ color: '#4ade80' }}>● {buyers.filter(b => b.status === 'Active').length} Active</span>
                <span style={{ color: '#f87171' }}>● {buyers.filter(b => b.status === 'Passed').length} Passed</span>
              </div>
            </div>
            {buyers.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ flex: 1, color: '#ccc', fontSize: '12px' }}>{b.name}</span>
                <button onClick={() => toggleBuyer(b.id)} style={{ background: b.status === 'Active' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: b.status === 'Active' ? '#4ade80' : '#f87171', border: `1px solid ${b.status === 'Active' ? '#166534' : '#991b1b'}`, borderRadius: '4px', fontSize: '10px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {b.status}
                </button>
                <button style={iconBtn} onClick={() => removeBuyer(b.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="Buyer name" value={newBuyer} onChange={e => setNewBuyer(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addBuyer() }} />
              <button onClick={addBuyer} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>+</button>
            </div>
          </div>

          {/* Co-Investors */}
          <div style={card}>
            <span style={sectionLabel}>Co-Investors</span>
            {coInvestors.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px', background: '#141414', borderRadius: '6px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e5e5e5', fontSize: '12px', fontWeight: 500 }}>{c.name}</div>
                  {c.firm && <div style={{ color: '#555', fontSize: '11px' }}>{c.firm}</div>}
                  {c.committed && <div style={{ color: '#9d8fff', fontSize: '11px' }}>{c.committed}</div>}
                </div>
                <button style={iconBtn} onClick={() => removeCoInvestor(c.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              <input style={inputStyle} placeholder="Name" value={newCoInv.name} onChange={e => setNewCoInv(c => ({ ...c, name: e.target.value }))} />
              <input style={inputStyle} placeholder="Firm (optional)" value={newCoInv.firm} onChange={e => setNewCoInv(c => ({ ...c, firm: e.target.value }))} />
              <input style={inputStyle} placeholder="Amount committed (optional)" value={newCoInv.committed} onChange={e => setNewCoInv(c => ({ ...c, committed: e.target.value }))} />
              <button onClick={addCoInvestor} style={addBtn}>+ Add Co-Investor</button>
            </div>
          </div>

          {/* Recommended Contacts */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionLabel}>Recommended Contacts</span>
              <button onClick={generateContacts} disabled={aiLoading} style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
                {aiLoading ? 'Generating…' : '✦ AI Suggest'}
              </button>
            </div>
            {contacts.map(c => (
              <div key={c.id} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '10px', marginBottom: '8px', position: 'relative' }}>
                <button style={{ ...iconBtn, position: 'absolute', top: 6, right: 6 }} onClick={() => removeContact(c.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                  <input style={inputStyle} value={c.firm} onChange={e => updateContact(c.id, 'firm', e.target.value)} onBlur={saveContacts} placeholder="Firm" />
                  <input style={inputStyle} value={c.name} onChange={e => updateContact(c.id, 'name', e.target.value)} onBlur={saveContacts} placeholder="Contact name" />
                </div>
                <input style={{ ...inputStyle, marginBottom: '6px' }} value={c.email} onChange={e => updateContact(c.id, 'email', e.target.value)} onBlur={saveContacts} placeholder="email@firm.com" />
                <input style={inputStyle} value={c.notes} onChange={e => updateContact(c.id, 'notes', e.target.value)} onBlur={saveContacts} placeholder="Notes…" />
              </div>
            ))}
            <button style={addBtn} onClick={addContact}>+ Add Contact</button>
          </div>

          {/* Email Buyers */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={sectionLabel}>Email Outreach</span>
              <button
                onClick={generateEmail}
                disabled={emailLoading}
                style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
              >
                {emailLoading ? 'Generating…' : '✦ Generate Email'}
              </button>
            </div>

            {emailPanel && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.filter(c => c.email).length > 0 && (
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                    To: {contacts.filter(c => c.email).map(c => c.email).join(', ')}
                  </div>
                )}
                <div>
                  <div style={{ color: '#555', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</div>
                  <input
                    style={inputStyle}
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder={emailLoading ? 'Generating subject…' : 'Email subject…'}
                  />
                </div>
                <div>
                  <div style={{ color: '#555', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body</div>
                  <textarea
                    style={{ ...inputStyle, minHeight: '180px', resize: 'vertical', lineHeight: 1.6 }}
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    placeholder={emailLoading ? 'Generating email…' : 'Email body…'}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={openMailto}
                    style={{ background: '#7c6af7', border: 'none', color: '#fff', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 }}
                  >
                    Open in Email Client
                  </button>
                  <button
                    onClick={copyEmailBody}
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: emailCopied ? '#4ade80' : '#aaa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                  >
                    {emailCopied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setEmailPanel(false)}
                    style={{ background: 'none', border: '1px solid #1f1f1f', color: '#444', borderRadius: '6px', padding: '7px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {!emailPanel && (
              <div style={{ color: '#333', fontSize: '12px' }}>
                Generate a professional deal summary email to send to contacts or buyers.
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── PDF Viewer Modal ── */}
      {viewDoc && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', flexDirection: 'column' }}
          onClick={e => { if (e.target === e.currentTarget) setViewDoc(null) }}
        >
          <div style={{ height: '52px', background: '#111', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0 }}>
            <span style={{ color: '#f0f0f0', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {viewDoc.name}</span>
            <a href={viewDoc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#9d8fff', fontSize: '12px', textDecoration: 'none' }}>Open in new tab ↗</a>
            <button onClick={() => setViewDoc(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>✕</button>
          </div>
          <iframe
            src={viewDoc.url}
            title={viewDoc.name}
            style={{ flex: 1, border: 'none', width: '100%' }}
          />
        </div>
      )}

      {/* ── Edit modal ── */}
      {showEditModal && (
        <DealModal deal={deal} onSave={handleEditSave} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  )
}
