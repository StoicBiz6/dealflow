import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { STAGES, STAGE_COLORS, SECTORS } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'
import DealModal from '../components/DealModal'
import * as XLSX from 'xlsx'

// ─── Shared styles ──────────────────────────────────────────────────────────
const card = { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
const sectionLabel = { fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', display: 'block' }
const inputStyle = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: '#e5e5e5', fontSize: '12px', padding: '7px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
const addBtn = { background: 'none', border: '1px dashed #2a2a2a', borderRadius: '6px', color: '#555', cursor: 'pointer', fontSize: '12px', padding: '7px 12px', width: '100%', textAlign: 'left', fontFamily: 'inherit', marginTop: '8px' }
const iconBtn = { background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'inherit' }
const metaKey = { color: '#555', fontSize: '12px' }
const metaVal = { color: '#ccc', fontSize: '12px', fontWeight: 500 }

// ─── Buyer Universe Row (expandable contact card) ────────────────────────────
function BuyerUniverseRow({ buyer, onUpdate, onAddToContacts, onAddToBuyers, isInBuyers }) {
  const [expanded, setExpanded] = useState(false)
  const hasContact = buyer.email || buyer.phone || buyer.notes
  const typeColors = { PE: { bg: 'rgba(99,102,241,0.1)', text: '#818cf8', border: 'rgba(99,102,241,0.3)' }, Strategic: { bg: 'rgba(245,158,11,0.1)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }, 'Family Office': { bg: 'rgba(16,185,129,0.1)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }, 'Growth Equity': { bg: 'rgba(59,130,246,0.1)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } }
  const tc = typeColors[buyer.type] || { bg: 'rgba(255,255,255,0.05)', text: '#888', border: '#333' }
  const pbUrl = `https://app.pitchbook.com/search?q=${encodeURIComponent(buyer.pitchbook_query || buyer.name)}`

  return (
    <div style={{ background: '#141414', border: `1px solid ${expanded ? '#2a2a3a' : '#1f1f1f'}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px', flexWrap: 'wrap' }}>
            <span
              style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0f0f0', cursor: 'default', userSelect: 'none' }}
              onDoubleClick={() => setExpanded(x => !x)}
              title="Double-click to add contact info"
            >
              {buyer.name}
            </span>
            <span style={{ background: tc.bg, color: tc.text, border: `1px solid ${tc.border}`, borderRadius: '4px', fontSize: '10px', padding: '1px 7px', flexShrink: 0 }}>{buyer.type}</span>
            {hasContact && !expanded && (
              <span style={{ color: '#7c6af7', fontSize: '11px', cursor: 'pointer' }} onClick={() => setExpanded(true)} title="Has contact info">✉</span>
            )}
          </div>
          <div style={{ color: '#666', fontSize: '12px', lineHeight: 1.5 }}>{buyer.thesis}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
          <a href={pbUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '6px', padding: '5px 10px', textDecoration: 'none', color: '#9d8fff', fontSize: '11px', whiteSpace: 'nowrap' }}>
            PitchBook ↗
          </a>
          {buyer.website && (
            <a href={buyer.website.startsWith('http') ? buyer.website : `https://${buyer.website}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#141414', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '5px 10px', textDecoration: 'none', color: '#888', fontSize: '11px', whiteSpace: 'nowrap' }}>
              Website ↗
            </a>
          )}
          <button
            onClick={() => !isInBuyers && onAddToBuyers(buyer)}
            disabled={isInBuyers}
            style={{ background: isInBuyers ? 'rgba(74,222,128,0.06)' : 'rgba(74,222,128,0.1)', border: `1px solid ${isInBuyers ? '#166534' : '#166534'}`, color: isInBuyers ? '#4ade80' : '#4ade80', borderRadius: '6px', padding: '5px 10px', cursor: isInBuyers ? 'default' : 'pointer', fontSize: '11px', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: isInBuyers ? 0.5 : 1 }}
            title={isInBuyers ? 'Already in Buyers list' : 'Add to tracked Buyers'}
          >
            {isInBuyers ? '✓ In Buyers' : '+ Buyers'}
          </button>
          <button
            onClick={() => setExpanded(x => !x)}
            style={{ background: 'none', border: 'none', color: expanded ? '#7c6af7' : '#333', cursor: 'pointer', fontSize: '11px', padding: '2px 4px', fontFamily: 'inherit' }}
          >
            {expanded ? '▾ contacts' : '▸ contacts'}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Name</div>
              <input style={inputStyle} value={buyer.contact_name || ''} onChange={e => onUpdate({ ...buyer, contact_name: e.target.value })} placeholder="e.g. Jane Smith" />
            </div>
            <div>
              <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</div>
              <input style={inputStyle} value={buyer.contact_title || ''} onChange={e => onUpdate({ ...buyer, contact_title: e.target.value })} placeholder="e.g. Managing Director" />
            </div>
          </div>
          <div>
            <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</div>
            <input style={inputStyle} value={buyer.email || ''} onChange={e => onUpdate({ ...buyer, email: e.target.value })} placeholder="firstname.lastname@firm.com" />
          </div>
          <div>
            <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Website</div>
            <input style={inputStyle} value={buyer.website || ''} onChange={e => onUpdate({ ...buyer, website: e.target.value })} placeholder="https://www.firm.com" />
          </div>
          <div>
            <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone</div>
            <input style={inputStyle} value={buyer.phone || ''} onChange={e => onUpdate({ ...buyer, phone: e.target.value })} placeholder="Phone" />
          </div>
          <div>
            <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes</div>
            <input style={inputStyle} value={buyer.notes || ''} onChange={e => onUpdate({ ...buyer, notes: e.target.value })} placeholder="Notes…" />
          </div>
          {(buyer.email || buyer.contact_name) && (
            <button
              onClick={() => onAddToContacts(buyer)}
              style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
            >
              → Add to Contacts
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Buyer Row (expandable contact card) ─────────────────────────────────────
function BuyerRow({ buyer, onToggle, onRemove, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const hasContact = buyer.email || buyer.phone || buyer.firm
  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{ flex: 1, color: '#ccc', fontSize: '12px', cursor: 'default', userSelect: 'none' }}
          onDoubleClick={() => setExpanded(x => !x)}
          title="Double-click to view/edit contact info"
        >
          {buyer.name || <span style={{ color: '#444' }}>Unnamed</span>}
        </span>
        {hasContact && !expanded && (
          <span style={{ color: '#7c6af7', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }} onClick={() => setExpanded(true)} title="Has contact info">✉</span>
        )}
        <button
          onClick={() => onUpdate({ ...buyer, emailed: !buyer.emailed })}
          title={buyer.emailed ? 'Mark as not emailed' : 'Mark as emailed'}
          style={{ background: buyer.emailed ? 'rgba(74,222,128,0.08)' : 'transparent', border: `1px solid ${buyer.emailed ? '#166534' : '#2a2a2a'}`, borderRadius: '4px', color: buyer.emailed ? '#4ade80' : '#333', fontSize: '11px', padding: '2px 7px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s' }}
        >
          {buyer.emailed ? '✓ Emailed' : '✉'}
        </button>
        <button onClick={onToggle} style={{ background: buyer.status === 'Active' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: buyer.status === 'Active' ? '#4ade80' : '#f87171', border: `1px solid ${buyer.status === 'Active' ? '#166534' : '#991b1b'}`, borderRadius: '4px', fontSize: '10px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}>
          {buyer.status}
        </button>
        <button
          style={{ ...iconBtn, color: expanded ? '#7c6af7' : '#333', fontSize: '10px' }}
          onClick={() => setExpanded(x => !x)}
          title="Toggle contact info"
        >
          {expanded ? '▾' : '▸'}
        </button>
        <button style={iconBtn} onClick={onRemove} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
      </div>
      {expanded && (
        <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <input style={inputStyle} value={buyer.email || ''} onChange={e => onUpdate({ ...buyer, email: e.target.value })} placeholder="email@firm.com" />
            <input style={inputStyle} value={buyer.phone || ''} onChange={e => onUpdate({ ...buyer, phone: e.target.value })} placeholder="Phone" />
          </div>
          <input style={inputStyle} value={buyer.firm || ''} onChange={e => onUpdate({ ...buyer, firm: e.target.value })} placeholder="Firm / Organization" />
          <input style={inputStyle} value={buyer.notes || ''} onChange={e => onUpdate({ ...buyer, notes: e.target.value })} placeholder="Notes…" />
        </div>
      )}
    </div>
  )
}

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
  const { user } = useUser()
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
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [buyerUniverse, setBuyerUniverse] = useState([])  // saved buyer universe (persisted)
  const [buyerLoading, setBuyerLoading] = useState(false)
  const [buyerTypeFilter, setBuyerTypeFilter] = useState(null)  // null = all
  const [buyerSearch, setBuyerSearch] = useState('')
  const [buyerTypeSelect, setBuyerTypeSelect] = useState('')    // pre-generation: '' = all
  const [cimParsing, setCimParsing] = useState(false)
  const [cimPreview, setCimPreview] = useState(null)            // parsed fields awaiting apply
  const [cimPreviewSource, setCimPreviewSource] = useState('cim') // 'cim' | 'voice'
  const [voiceListening, setVoiceListening] = useState(false)
  const [marketNews, setMarketNews] = useState(null)            // market intelligence data
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsCollapsed, setNewsCollapsed] = useState(false)
  const [buyerUniverseCollapsed, setBuyerUniverseCollapsed] = useState(false)
  // CIM Q&A
  const [cimMessages, setCimMessages] = useState([])
  const [cimInput, setCimInput] = useState('')
  const [cimQALoading, setCimQALoading] = useState(false)
  // Comparable Valuation
  const [compValuation, setCompValuation] = useState(null)
  const [compValLoading, setCompValLoading] = useState(false)
  // Comments
  const [comments, setComments] = useState([])
  const [commentInput, setCommentInput] = useState('')
  const [commentsCollapsed, setCommentsCollapsed] = useState(false)
  // Deal Room Share
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareEmailInput, setShareEmailInput] = useState('')
  const [sharedWith, setSharedWith] = useState([])
  const [shareSaving, setShareSaving] = useState(false)
  // Google Calendar
  const [calSyncing, setCalSyncing] = useState(false)
  const [calEventUrl, setCalEventUrl] = useState(null)
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false)

  // Fetch deal
  useEffect(() => {
    setLoading(true)
    setDeal(null)
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
      setBuyerUniverse(data.buyer_universe || [])
      setComments(data.comments || [])
      setSharedWith(data.shared_with || [])
      setLoading(false)
      // Check if user has Google Calendar auth
      if (data.user_id) {
        supabase.from('user_google_tokens').select('user_id').eq('user_id', data.user_id).single()
          .then(({ data: tok }) => setHasGoogleAuth(!!tok))
      }
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
  const updateBuyer = (updated) => {
    const next = buyers.map(b => b.id === updated.id ? updated : b)
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

    // Auto-parse PDFs and offer to update deal fields
    if (file.type === 'application/pdf') {
      setCimPreviewSource('cim')
      setCimParsing(true)
      try {
        const res = await fetch('/api/parse-cim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: publicUrl }),
        })
        const parsed = await res.json()
        if (parsed.error) {
          alert('CIM parsing failed: ' + parsed.error)
        } else {
          setCimPreview(parsed)
        }
      } catch (err) {
        alert('CIM parsing error: ' + err.message)
      }
      setCimParsing(false)
    }
  }

  const applyCimPreview = async () => {
    if (!cimPreview) return
    const updates = {}
    const fields = ['company_name', 'sector', 'raise_amount', 'valuation', 'fee_pct', 'stage', 'website', 'deal_owner', 'notes', 'timeline_to_close']
    fields.forEach(f => { if (cimPreview[f] != null && cimPreview[f] !== '') updates[f] = cimPreview[f] })
    if (cimPreview.memo) { updates.memo = cimPreview.memo; setMemo(cimPreview.memo) }
    if (cimPreview.metrics && Object.keys(cimPreview.metrics).length) { updates.metrics = cimPreview.metrics; setMetrics(cimPreview.metrics) }
    if (cimPreview.contacts?.length) { updates.contacts = cimPreview.contacts; setContacts(cimPreview.contacts) }
    if (cimPreview.co_investors?.length) { updates.co_investors = cimPreview.co_investors; setCoInvestors(cimPreview.co_investors) }
    if (cimPreview.score && typeof cimPreview.score === 'object') { updates.score = cimPreview.score; setScore(cimPreview.score) }
    if (Object.keys(updates).length === 0) {
      alert('No extractable fields found in this document. It may not be a CIM or the document is not machine-readable.')
      setCimPreview(null)
      return
    }
    const { error } = await supabase.from('deals').update(updates).eq('id', id)
    if (error) {
      alert('Save failed: ' + error.message)
      return
    }
    setDeal(prev => ({ ...prev, ...updates }))
    setCimPreview(null)
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
        body: JSON.stringify({ deal: { ...deal, memo }, types: buyerTypeSelect ? [buyerTypeSelect] : undefined }),
      })
      const data = await res.json()
      if (data.buyers) {
        // Merge new results with existing, preserving any contact info already added
        const existing = buyerUniverse.reduce((m, b) => { m[b.name] = b; return m }, {})
        const merged = data.buyers.map(b => {
          const prev = existing[b.name]
          // Preserve any manually edited fields; fall back to AI-generated values
          return {
            ...b,
            contact_name: (prev?.contact_name ?? b.contact_name) || '',
            contact_title: (prev?.contact_title ?? b.contact_title) || '',
            email: (prev?.email ?? b.email) || '',
            phone: prev?.phone || '',
            notes: prev?.notes || '',
            website: (prev?.website ?? b.website) || '',
          }
        })
        setBuyerUniverse(merged)
        save({ buyer_universe: merged })
      }
    } catch { }
    setBuyerLoading(false)
  }

  const updateBuyerUniverse = (updated) => {
    const next = buyerUniverse.map(b => b.name === updated.name ? updated : b)
    setBuyerUniverse(next)
    save({ buyer_universe: next })
  }

  const downloadBuyerUniverse = () => {
    const rows = buyerUniverse.map(b => ({
      'Firm': b.name || '',
      'Type': b.type || '',
      'Investment Thesis': b.thesis || '',
      'Website': b.website || '',
      'Contact Name': b.contact_name || '',
      'Contact Title': b.contact_title || '',
      'Email': b.email || '',
      'Phone': b.phone || '',
      'Notes': b.notes || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    // Column widths
    ws['!cols'] = [30, 14, 50, 28, 22, 22, 28, 16, 30].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Buyer Universe')
    XLSX.writeFile(wb, `${deal.company_name} - Buyer Universe.xlsx`)
  }

  const addBuyerUniverseToContacts = (buyer) => {
    const newContact = {
      id: crypto.randomUUID(),
      name: buyer.contact_name || '',
      firm: buyer.name,
      email: buyer.email || '',
      notes: buyer.notes || '',
    }
    const next = [...contacts, newContact]
    setContacts(next)
    save({ contacts: next })
  }

  const addBuyerUniverseToBuyers = (buyer) => {
    if (buyers.some(b => b.name === buyer.name)) return
    const newEntry = {
      id: crypto.randomUUID(),
      name: buyer.contact_name ? `${buyer.contact_name}${buyer.contact_title ? ` (${buyer.contact_title})` : ''}` : buyer.name,
      status: 'Active',
      email: buyer.email || '',
      phone: buyer.phone || '',
      firm: buyer.name,
      notes: buyer.notes || '',
    }
    const next = [...buyers, newEntry]
    setBuyers(next)
    save({ buyers: next })
  }

  const startVoice = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    // Request mic permission first — prevents the "network" error in Chrome
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop()) // release mic, we just needed the grant
    } catch {
      alert('Microphone access denied. Please click the lock icon in your address bar and allow microphone access, then try again.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    setVoiceListening(true)
    setCimPreview(null)

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript
      setVoiceListening(false)
      setCimPreviewSource('voice')
      setCimParsing(true)
      try {
        const res = await fetch('/api/voice-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript }),
        })
        const parsed = await res.json()
        if (parsed.error) {
          alert('Voice parsing failed: ' + parsed.error)
        } else {
          setCimPreview(parsed)
        }
      } catch (err) {
        alert('Voice error: ' + err.message)
      }
      setCimParsing(false)
    }

    recognition.onerror = (event) => {
      setVoiceListening(false)
      if (event.error !== 'no-speech') alert('Voice error: ' + event.error)
    }

    recognition.onend = () => setVoiceListening(false)

    recognition.start()
  }

  const loadMarketNews = async () => {
    setNewsLoading(true)
    try {
      const res = await fetch('/api/deal-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: { ...deal, memo } }),
      })
      const data = await res.json()
      if (data.error) alert('Market intel error: ' + data.error)
      else setMarketNews(data)
    } catch (e) {
      alert('Market intel error: ' + e.message)
    }
    setNewsLoading(false)
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

  const sendEmailViaResend = async () => {
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      alert('Please fill in recipient, subject, and body before sending.')
      return
    }
    setEmailSending(true)
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: emailTo.trim(), subject: emailSubject, body: emailBody }),
      })
      const data = await res.json()
      if (data.error) {
        alert('Send failed: ' + data.error)
      } else {
        setEmailSent(true)
        setTimeout(() => setEmailSent(false), 3000)
        // Log to activity
        const logEntry = { id: crypto.randomUUID(), type: 'email', note: `Email sent to ${emailTo}: "${emailSubject}"`, date: new Date().toISOString() }
        const next = [logEntry, ...activity]
        setActivity(next)
        save({ activity_log: next })
      }
    } catch (e) {
      alert('Send error: ' + e.message)
    }
    setEmailSending(false)
  }

  // CIM Q&A
  const askCimQuestion = async () => {
    const q = cimInput.trim()
    if (!q || cimQALoading) return
    setCimMessages(prev => [...prev, { role: 'user', text: q }])
    setCimInput('')
    setCimQALoading(true)
    try {
      const res = await fetch('/api/cim-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, deal: { ...deal, memo, metrics, score } }),
      })
      const data = await res.json()
      if (data.error) {
        setCimMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + data.error }])
      } else {
        setCimMessages(prev => [...prev, { role: 'assistant', text: data.answer }])
      }
    } catch (e) {
      setCimMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + e.message }])
    }
    setCimQALoading(false)
  }

  // Comparable Valuation
  const loadComparableValuation = async () => {
    setCompValLoading(true)
    try {
      const res = await fetch('/api/comparable-valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: { ...deal, memo, metrics } }),
      })
      const data = await res.json()
      if (data.error) alert('Valuation error: ' + data.error)
      else setCompValuation(data)
    } catch (e) {
      alert('Valuation error: ' + e.message)
    }
    setCompValLoading(false)
  }

  // Comments
  const addComment = () => {
    if (!commentInput.trim() || !user) return
    const newComment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      user_name: user.fullName || user.firstName || user.emailAddresses?.[0]?.emailAddress || 'User',
      text: commentInput.trim(),
      created_at: new Date().toISOString(),
    }
    const next = [newComment, ...comments]
    setComments(next)
    setCommentInput('')
    save({ comments: next })
  }
  const removeComment = (cid) => {
    const next = comments.filter(c => c.id !== cid)
    setComments(next)
    save({ comments: next })
  }

  // Deal Room Share
  const saveShareList = async (emails) => {
    setShareSaving(true)
    await save({ shared_with: emails })
    setSharedWith(emails)
    setShareSaving(false)
  }
  const addShareEmail = () => {
    const email = shareEmailInput.trim().toLowerCase()
    if (!email || sharedWith.includes(email)) { setShareEmailInput(''); return }
    const next = [...sharedWith, email]
    setShareEmailInput('')
    saveShareList(next)
  }
  const removeShareEmail = (email) => {
    saveShareList(sharedWith.filter(e => e !== email))
  }
  const copyShareLink = () => {
    const link = `${window.location.origin}/deal-room/${id}`
    navigator.clipboard.writeText(link)
    alert(`Copied: ${link}\n\nShare this link with: ${sharedWith.join(', ') || '(no one yet)'}`)
  }

  // Google Calendar
  const syncToCalendar = async () => {
    if (!hasGoogleAuth) {
      // Redirect to Google OAuth
      window.location.href = `/api/google-calendar?userId=${user?.id}&returnTo=/deal/${id}`
      return
    }
    setCalSyncing(true)
    try {
      const res = await fetch('/api/google-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: { ...deal, memo }, userId: user?.id }),
      })
      const data = await res.json()
      if (data.error) alert('Calendar sync error: ' + data.error)
      else if (data.htmlLink) setCalEventUrl(data.htmlLink)
    } catch (e) {
      alert('Calendar sync error: ' + e.message)
    }
    setCalSyncing(false)
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
        <button
          onClick={startVoice}
          disabled={voiceListening || cimParsing}
          title="Speak to update deal fields"
          style={{ background: voiceListening ? 'rgba(239,68,68,0.12)' : 'rgba(124,106,247,0.1)', border: `1px solid ${voiceListening ? '#991b1b' : '#4a3fa0'}`, color: voiceListening ? '#f87171' : '#9d8fff', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.2s' }}
        >
          {voiceListening ? <>● <span>Listening…</span></> : <>🎤 <span>Voice</span></>}
        </button>
        <button
          onClick={syncToCalendar}
          disabled={calSyncing}
          title={hasGoogleAuth ? 'Sync deal to Google Calendar' : 'Connect Google Calendar'}
          style={{ background: calEventUrl ? 'rgba(74,222,128,0.08)' : 'transparent', border: `1px solid ${calEventUrl ? '#166534' : '#2a2a2a'}`, color: calEventUrl ? '#4ade80' : '#555', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          {calSyncing ? '…' : calEventUrl ? '📅 Synced' : '📅 Calendar'}
        </button>
        {calEventUrl && (
          <a href={calEventUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4ade80', fontSize: '11px', textDecoration: 'none' }}>↗</a>
        )}
        <button
          onClick={() => setShowShareModal(true)}
          title="Share deal room with clients"
          style={{ background: sharedWith.length ? 'rgba(124,106,247,0.1)' : 'transparent', border: `1px solid ${sharedWith.length ? '#4a3fa0' : '#2a2a2a'}`, color: sharedWith.length ? '#9d8fff' : '#555', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
        >
          🔗 Share
        </button>
        <button onClick={handleDelete} style={{ background: 'none', border: '1px solid #2a2a2a', color: '#f87171', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Delete</button>
        <UserButton afterSignOutUrl="/" />
      </nav>

      {/* ── CIM / voice parse banner ── */}
      {(voiceListening || cimParsing) && (
        <div style={{ background: 'rgba(124,106,247,0.08)', borderBottom: '1px solid rgba(124,106,247,0.2)', padding: '10px 32px', color: '#9d8fff', fontSize: '12px', textAlign: 'center' }}>
          {voiceListening ? '🎤 Listening — speak your update…' : cimPreviewSource === 'voice' ? 'Processing voice command…' : 'Parsing PDF and extracting deal fields…'}
        </div>
      )}
      {cimPreview && !cimParsing && !voiceListening && (
        <div style={{ background: '#0f0f1a', borderBottom: '1px solid rgba(124,106,247,0.25)', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span style={{ color: '#9d8fff', fontSize: '12px', fontWeight: 600 }}>{cimPreviewSource === 'voice' ? '🎤 Voice update' : '✦ CIM parsed'}</span>
          <div style={{ flex: 1, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              cimPreview.company_name && `Company: ${cimPreview.company_name}`,
              cimPreview.sector && `Sector: ${cimPreview.sector}`,
              cimPreview.raise_amount && `Raise: $${(cimPreview.raise_amount/1e6).toFixed(1)}M`,
              cimPreview.valuation && `Val: $${(cimPreview.valuation/1e6).toFixed(1)}M`,
              cimPreview.stage && `Stage: ${cimPreview.stage}`,
              cimPreview.website && `Web: ${cimPreview.website}`,
              cimPreview.metrics && Object.keys(cimPreview.metrics).length && `${Object.keys(cimPreview.metrics).length} metrics`,
              cimPreview.contacts?.length && `${cimPreview.contacts.length} contacts`,
            ].filter(Boolean).map((label, i) => (
              <span key={i} style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.2)', borderRadius: '4px', padding: '2px 8px', color: '#aaa', fontSize: '11px' }}>{label}</span>
            ))}
          </div>
          <button onClick={applyCimPreview} style={{ background: 'rgba(124,106,247,0.15)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
            Apply to deal
          </button>
          <button onClick={() => setCimPreview(null)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
      )}

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

          {/* CIM Q&A — shown only when memo exists */}
          {memo && (
            <div style={card}>
              <span style={sectionLabel}>Ask About This Deal</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '280px', overflowY: 'auto' }}>
                {cimMessages.length === 0 && (
                  <div style={{ color: '#333', fontSize: '12px' }}>Ask anything about the memo, metrics, or deal terms.</div>
                )}
                {cimMessages.map((m, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    background: m.role === 'user' ? '#1a1a2e' : '#141414',
                    border: `1px solid ${m.role === 'user' ? 'rgba(124,106,247,0.2)' : '#1f1f1f'}`,
                    borderRadius: '8px',
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '90%',
                  }}>
                    <div style={{ color: m.role === 'user' ? '#9d8fff' : '#ccc', fontSize: '12px', lineHeight: 1.6 }}>{m.text}</div>
                  </div>
                ))}
                {cimQALoading && (
                  <div style={{ color: '#555', fontSize: '12px', padding: '4px 12px' }}>Thinking…</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="What are the key risks? What's the revenue model? …"
                  value={cimInput}
                  onChange={e => setCimInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); askCimQuestion() } }}
                />
                <button
                  onClick={askCimQuestion}
                  disabled={!cimInput.trim() || cimQALoading}
                  style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: cimInput.trim() ? '#9d8fff' : '#555', borderRadius: '6px', padding: '7px 14px', cursor: cimInput.trim() ? 'pointer' : 'default', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  Ask
                </button>
              </div>
            </div>
          )}

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

          {/* Comments Thread */}
          <div style={card}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: commentsCollapsed ? 0 : '14px', cursor: 'pointer' }}
              onClick={() => setCommentsCollapsed(x => !x)}
            >
              <span style={{ ...sectionLabel, margin: 0 }}>Notes & Comments {comments.length > 0 && <span style={{ color: '#555', fontWeight: 400 }}>({comments.length})</span>}</span>
              <span style={{ color: '#333', fontSize: '12px', userSelect: 'none' }}>{commentsCollapsed ? '▸' : '▾'}</span>
            </div>
            {!commentsCollapsed && (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }} onClick={e => e.stopPropagation()}>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="Add a note or comment…"
                    value={commentInput}
                    onChange={e => setCommentInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment() } }}
                  />
                  <button onClick={addComment} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0 }}>Post</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ color: '#7c6af7', fontSize: '11px', fontWeight: 600 }}>{c.user_name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#333', fontSize: '10px' }}>{formatDate(c.created_at)}</span>
                          {c.user_id === user?.id && (
                            <button style={{ ...iconBtn, fontSize: '12px' }} onClick={() => removeComment(c.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
                          )}
                        </div>
                      </div>
                      <div style={{ color: '#ccc', fontSize: '12px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.text}</div>
                    </div>
                  ))}
                  {comments.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No comments yet. Add internal notes or collaborate with your team.</div>}
                </div>
              </>
            )}
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
                  <>
                    <button onClick={() => setViewDoc(doc)} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '5px', fontSize: '11px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>View</button>
                    <button
                      onClick={async () => {
                        setCimPreviewSource('cim'); setCimParsing(true); setCimPreview(null)
                        try {
                          const res = await fetch('/api/parse-cim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: doc.url }) })
                          const parsed = await res.json()
                          if (parsed.error) {
                            alert('CIM parsing failed: ' + parsed.error)
                          } else {
                            setCimPreview(parsed)
                          }
                        } catch (err) {
                          alert('CIM parsing error: ' + err.message)
                        }
                        setCimParsing(false)
                      }}
                      style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '5px', fontSize: '11px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                    >
                      {cimParsing ? '…' : 'Update deal'}
                    </button>
                  </>
                )}
                <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ color: '#444', fontSize: '11px', textDecoration: 'none', flexShrink: 0 }}>↗</a>
                <span style={{ color: '#333', fontSize: '11px', flexShrink: 0 }}>{fmtSize(doc.size)}</span>
                <button style={iconBtn} onClick={() => removeDocument(doc.id)} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
              </div>
            ))}
            {documents.length === 0 && <div style={{ color: '#333', fontSize: '12px' }}>No documents uploaded</div>}
          </div>

          {/* Market Intelligence */}
          <div style={card}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: newsCollapsed ? 0 : '14px' }}
              onClick={() => setNewsCollapsed(x => !x)}
            >
              <div>
                <span style={sectionLabel}>Market Intelligence</span>
                {!newsCollapsed && <div style={{ color: '#444', fontSize: '11px', marginTop: '-10px' }}>Comparable deals · Active investors · Sector trends</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {!newsCollapsed && (
                  <button
                    onClick={e => { e.stopPropagation(); loadMarketNews() }}
                    disabled={newsLoading}
                    style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                  >
                    {newsLoading ? 'Loading…' : marketNews ? '↺ Refresh' : '✦ Load Intel'}
                  </button>
                )}
                <span style={{ color: '#333', fontSize: '12px', userSelect: 'none' }}>{newsCollapsed ? '▸' : '▾'}</span>
              </div>
            </div>

            {!newsCollapsed && (
              <>
                {newsLoading && (
                  <div style={{ color: '#555', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
                    Scanning recent deals and investor activity…
                  </div>
                )}

                {!newsLoading && !marketNews && (
                  <div style={{ color: '#333', fontSize: '12px' }}>
                    Load market intelligence to see comparable recent transactions, active investors in this space, and relevant sector trends.
                  </div>
                )}

                {!newsLoading && marketNews && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Comparable Deals */}
                    {marketNews.comparable_deals?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Comparable Transactions</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {marketNews.comparable_deals.map((deal, i) => (
                            <div key={i} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#e5e5e5', lineHeight: 1.3 }}>{deal.title}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                                  {deal.amount && <span style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: '4px', padding: '1px 7px', color: '#9d8fff', fontSize: '11px', whiteSpace: 'nowrap' }}>{deal.amount}</span>}
                                  {deal.date && <span style={{ color: '#444', fontSize: '10px' }}>{deal.date}</span>}
                                </div>
                              </div>
                              {deal.investors?.length > 0 && (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                  {deal.investors.map((inv, j) => (
                                    <span key={j} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '1px 6px', color: '#666', fontSize: '10px' }}>{inv}</span>
                                  ))}
                                </div>
                              )}
                              {deal.relevance && <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{deal.relevance}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Investors */}
                    {marketNews.active_investors?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Active Investors in This Space</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {marketNews.active_investors.map((inv, i) => {
                            const typeColors = { PE: '#818cf8', VC: '#60a5fa', 'Growth Equity': '#60a5fa', 'Family Office': '#34d399', Strategic: '#fbbf24' }
                            return (
                              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 600, color: '#e5e5e5' }}>{inv.name}</span>
                                    {inv.type && <span style={{ color: typeColors[inv.type] || '#888', fontSize: '10px', flexShrink: 0 }}>{inv.type}</span>}
                                  </div>
                                  {inv.recent_activity && <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{inv.recent_activity}</div>}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Market Trends */}
                    {marketNews.market_trends?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Sector Trends</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {marketNews.market_trends.map((t, i) => (
                            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 12px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                              <span style={{ color: '#7c6af7', fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>↗</span>
                              <div>
                                <div style={{ color: '#ccc', fontSize: '12px', fontWeight: 500, marginBottom: '3px' }}>{t.trend}</div>
                                {t.detail && <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{t.detail}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ color: '#2a2a2a', fontSize: '10px', textAlign: 'right' }}>
                      Based on AI market knowledge through early 2025
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Buyer Universe */}
          <div style={card}>
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: buyerUniverseCollapsed ? 0 : '14px' }}
              onClick={() => setBuyerUniverseCollapsed(x => !x)}
            >
              <div>
                <span style={sectionLabel}>Buyer Universe</span>
                {!buyerUniverseCollapsed && <div style={{ color: '#444', fontSize: '11px', marginTop: '-10px' }}>AI-generated · opens PitchBook profile</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {!buyerUniverseCollapsed && (
                  <>
                    <select
                      value={buyerTypeSelect}
                      onChange={e => { e.stopPropagation(); setBuyerTypeSelect(e.target.value) }}
                      onClick={e => e.stopPropagation()}
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', color: buyerTypeSelect ? '#ccc' : '#555', fontSize: '12px', padding: '6px 10px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
                    >
                      <option value=''>All types</option>
                      <option value='PE'>PE</option>
                      <option value='Strategic'>Strategic</option>
                      <option value='Family Office'>Family Office</option>
                      <option value='Growth Equity'>Growth Equity</option>
                    </select>
                    <button
                      onClick={e => { e.stopPropagation(); findBuyers() }}
                      disabled={buyerLoading}
                      style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    >
                      {buyerLoading ? 'Searching…' : buyerUniverse.length ? '↺ Refresh' : '✦ Find Buyers'}
                    </button>
                    {buyerUniverse.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadBuyerUniverse() }}
                        title="Download as Excel"
                        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                      >
                        ↓ Excel
                      </button>
                    )}
                  </>
                )}
                <span style={{ color: '#333', fontSize: '12px', userSelect: 'none' }}>{buyerUniverseCollapsed ? '▸' : '▾'}</span>
              </div>
            </div>

            {!buyerUniverseCollapsed && (
              <>
                {buyerLoading && (
                  <div style={{ color: '#555', fontSize: '12px', padding: '20px 0', textAlign: 'center' }}>
                    Analyzing deal profile and identifying buyers…
                  </div>
                )}

                {!buyerLoading && buyerUniverse.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      value={buyerSearch}
                      onChange={e => setBuyerSearch(e.target.value)}
                      placeholder="Search buyers…"
                      style={{ background: '#111', border: '1px solid #222', borderRadius: '6px', color: '#ccc', fontSize: '12px', padding: '6px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                    {buyerUniverse
                      .filter(b => !buyerTypeSelect || b.type === buyerTypeSelect)
                      .filter(b => !buyerSearch || b.name?.toLowerCase().includes(buyerSearch.toLowerCase()) || b.thesis?.toLowerCase().includes(buyerSearch.toLowerCase()))
                      .map((buyer, i) => (
                        <BuyerUniverseRow
                          key={i}
                          buyer={buyer}
                          onUpdate={updateBuyerUniverse}
                          onAddToContacts={addBuyerUniverseToContacts}
                          onAddToBuyers={addBuyerUniverseToBuyers}
                          isInBuyers={buyers.some(b => b.name === buyer.name)}
                        />
                      ))}
                  </div>
                )}

                {!buyerLoading && buyerUniverse.length === 0 && (
                  <div style={{ color: '#333', fontSize: '12px' }}>
                    Click "Find Buyers" to generate a targeted buyer universe based on this deal's profile — PE firms, strategic acquirers, and family offices with active mandates in this sector and size range.
                  </div>
                )}
              </>
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
              deal.fee_pct != null && { label: 'Fee %', value: `${deal.fee_pct}%` },
              deal.fee_pct != null && deal.raise_amount && { label: 'Est. Fee', value: formatCurrency(deal.raise_amount * deal.fee_pct / 100), highlight: true },
              { label: 'Sector', value: deal.sector },
              { label: 'Owner', value: deal.deal_owner },
              { label: 'Added', value: formatDate(deal.created_at) },
            ].filter(r => r && r.value && r.value !== '—').map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={metaKey}>{r.label}</span>
                <span style={{ ...metaVal, color: r.highlight ? '#9d8fff' : '#ccc', fontWeight: r.highlight ? 600 : 500 }}>{r.value}</span>
              </div>
            ))}
            {deal.website && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={metaKey}>Website</span>
                <a href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`} onClick={e => e.stopPropagation()} target="_blank" rel="noopener noreferrer" style={{ ...metaVal, color: '#9d8fff' }}>{deal.website}</a>
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
            {score.rationale && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1f1f1f', color: '#555', fontSize: '11px', lineHeight: 1.6 }}>
                {score.rationale}
              </div>
            )}
          </div>

          {/* Comparable Valuation */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compValuation ? '14px' : '0' }}>
              <span style={sectionLabel}>Comparable Valuation</span>
              <button
                onClick={loadComparableValuation}
                disabled={compValLoading}
                style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '5px 12px', cursor: compValLoading ? 'default' : 'pointer', fontSize: '12px', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                {compValLoading ? 'Analyzing…' : compValuation ? '↺ Refresh' : '✦ Run Analysis'}
              </button>
            </div>
            {!compValuation && !compValLoading && (
              <div style={{ color: '#333', fontSize: '12px' }}>AI-powered valuation range based on comparable transactions.</div>
            )}
            {compValLoading && (
              <div style={{ color: '#555', fontSize: '12px', padding: '8px 0' }}>Analyzing comparable transactions…</div>
            )}
            {compValuation && !compValLoading && (
              <div>
                {/* Range bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#555', fontSize: '11px' }}>{formatCurrency(compValuation.low)}</span>
                    <span style={{ color: '#9d8fff', fontSize: '14px', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{formatCurrency(compValuation.mid)}</span>
                    <span style={{ color: '#555', fontSize: '11px' }}>{formatCurrency(compValuation.high)}</span>
                  </div>
                  <div style={{ height: '6px', background: '#1a1a1a', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(124,106,247,0.2), rgba(124,106,247,0.8), rgba(124,106,247,0.2))', borderRadius: '3px' }} />
                  </div>
                  <div style={{ color: '#555', fontSize: '10px', marginTop: '5px' }}>{compValuation.multiple_used} · {compValuation.method}</div>
                </div>
                {/* Rationale */}
                {compValuation.rationale && (
                  <div style={{ color: '#666', fontSize: '11px', lineHeight: 1.6, marginBottom: '12px' }}>{compValuation.rationale}</div>
                )}
                {/* Comps */}
                {compValuation.comps?.length > 0 && (
                  <div>
                    <div style={{ color: '#444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Comparable Transactions</div>
                    {compValuation.comps.map((c, i) => (
                      <div key={i} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px', padding: '8px 10px', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ color: '#e5e5e5', fontSize: '12px', fontWeight: 600 }}>{c.company}</span>
                          <span style={{ color: '#9d8fff', fontSize: '11px' }}>{c.value}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: c.notes ? '3px' : 0 }}>
                          <span style={{ color: '#555', fontSize: '10px' }}>{c.date}</span>
                          <span style={{ color: '#444', fontSize: '10px' }}>{c.multiple}</span>
                        </div>
                        {c.notes && <div style={{ color: '#444', fontSize: '10px', lineHeight: 1.5 }}>{c.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              <BuyerRow
                key={b.id}
                buyer={b}
                onToggle={() => toggleBuyer(b.id)}
                onRemove={() => removeBuyer(b.id)}
                onUpdate={updateBuyer}
              />
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
                <div>
                  <div style={{ color: '#555', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</div>
                  <input
                    style={inputStyle}
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder={contacts.filter(c => c.email)[0]?.email || 'recipient@example.com'}
                    onFocus={() => { if (!emailTo && contacts.filter(c => c.email).length) setEmailTo(contacts.filter(c => c.email)[0].email) }}
                  />
                </div>
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
                    onClick={sendEmailViaResend}
                    disabled={emailSending || !emailTo.trim()}
                    style={{ background: emailSent ? 'rgba(74,222,128,0.12)' : '#7c6af7', border: emailSent ? '1px solid #166534' : 'none', color: emailSent ? '#4ade80' : '#fff', borderRadius: '6px', padding: '7px 14px', cursor: emailSending ? 'default' : 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 }}
                  >
                    {emailSending ? 'Sending…' : emailSent ? '✓ Sent!' : '↑ Send'}
                  </button>
                  <button
                    onClick={openMailto}
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
                  >
                    Open in Mail App
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

      {/* ── Share / Deal Room Modal ── */}
      {showShareModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowShareModal(false) }}
        >
          <div style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '480px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, color: '#f0f0f0', marginBottom: '4px' }}>Share Deal Room</div>
                <div style={{ color: '#555', fontSize: '12px' }}>Clients must sign in to view the read-only deal summary</div>
              </div>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>

            {/* Add email */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#555', fontSize: '10px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add client email</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="client@company.com"
                  value={shareEmailInput}
                  onChange={e => setShareEmailInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addShareEmail() }}
                />
                <button
                  onClick={addShareEmail}
                  disabled={!shareEmailInput.trim() || shareSaving}
                  style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', borderRadius: '6px', padding: '7px 14px', cursor: shareEmailInput.trim() ? 'pointer' : 'default', fontSize: '12px', fontFamily: 'inherit', flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current share list */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#555', fontSize: '10px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Access granted to {sharedWith.length === 0 ? 'nobody yet' : `${sharedWith.length} person${sharedWith.length !== 1 ? 's' : ''}`}
              </div>
              {sharedWith.length === 0 ? (
                <div style={{ color: '#333', fontSize: '12px', padding: '8px 0' }}>No one has access yet. Add emails above.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sharedWith.map(email => (
                    <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '6px', padding: '8px 12px' }}>
                      <span style={{ flex: 1, color: '#ccc', fontSize: '12px' }}>{email}</span>
                      <button
                        onClick={() => removeShareEmail(email)}
                        style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: '14px', padding: '0 4px', lineHeight: 1 }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = '#333'}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share link */}
            <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
              <div style={{ color: '#555', fontSize: '10px', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deal Room URL</div>
              <div style={{ color: '#9d8fff', fontSize: '12px', wordBreak: 'break-all', marginBottom: '8px' }}>
                {window.location.origin}/deal-room/{id}
              </div>
              <button
                onClick={copyShareLink}
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '5px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}
              >
                Copy Link
              </button>
            </div>

            <div style={{ color: '#333', fontSize: '11px', lineHeight: 1.6 }}>
              Recipients must sign in with the email address you listed above. They'll see a read-only view of the company overview, stage, financials, and investment memo.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
