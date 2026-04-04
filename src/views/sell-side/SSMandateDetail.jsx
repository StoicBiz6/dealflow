import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { useBids, useBuyers } from '../../hooks/useSellSide'
import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

// ── Constants ────────────────────────────────────────────────────────────────
const STAGES = ['Prep phase', 'NDA / CIM', 'Mgmt meetings', 'First round bids', 'Final round', 'Exclusivity', 'Sign & close']
const STAGE_COLOR = { 'Prep phase':'gray','NDA / CIM':'blue','Mgmt meetings':'blue','First round bids':'amber','Final round':'amber','Exclusivity':'green','Sign & close':'green' }
const ACT_ICONS = { call:'📞', email:'✉️', meeting:'👥', note:'📝' }
const ACT_TYPES = ['call', 'email', 'meeting', 'note']
const FOLDERS = ['Financials', 'Commercial', 'Technology', 'Management', 'Legal', 'Diligence', 'Other']
const BID_STATUSES = ['IOI only', 'LOI pending', 'Final round', 'Exclusivity', 'Withdrawn']
const BID_STATUS_COLOR = { 'Final round':'green','LOI pending':'amber','IOI only':'blue','Exclusivity':'green','Withdrawn':'red' }
const BID_STRUCTURES = ['All cash', 'Cash + rollover', 'Cash + stock', 'Cash + earnout', 'Other']
const BLANK_BID = { buyer_name:'', amount:'', multiple:'', structure:'All cash', rollover_pct:'', status:'IOI only' }

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  card: { background:'#111', border:'0.5px solid rgba(255,255,255,0.08)', borderRadius:10, padding:20, marginBottom:12 },
  label: { fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:12, display:'block' },
  input: { background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#e5e5e5', fontSize:12, padding:'7px 10px', fontFamily:'inherit', outline:'none', width:'100%', boxSizing:'border-box' },
  metaKey: { color:'#555', fontSize:12 },
  metaVal: { color:'#ccc', fontSize:12, fontWeight:500 },
  iconBtn: { background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:14, padding:'2px 6px', borderRadius:4, fontFamily:'inherit' },
}

// ── Notes JSON helpers ───────────────────────────────────────────────────────
const parseNotes = (notes) => {
  try { const p = JSON.parse(notes || '{}'); return typeof p === 'object' ? p : {} } catch { return { summary: notes || '' } }
}
const serializeNotes = (obj) => JSON.stringify(obj)

// ── Format helpers ───────────────────────────────────────────────────────────
const fmt = (n) => { if (!n) return '—'; if (n >= 1000) return `$${(n/1000).toFixed(1)}B`; return `$${Math.round(n)}M` }
const stageStatus = (mandateStage, step) => {
  const mi = STAGES.indexOf(mandateStage), si = STAGES.indexOf(step)
  return si < mi ? 'done' : si === mi ? 'active' : 'pending'
}

// ── Main component ───────────────────────────────────────────────────────────
export default function SSMandateDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mandates, updateMandate, setActiveMandateId, loading } = useMandateContext()
  const [tab, setTab] = useState('overview')

  useEffect(() => { if (id) setActiveMandateId(id) }, [id])

  const mandate = mandates.find(m => m.id === id)

  if (loading) return <div style={{ color:c.text3, fontSize:13 }}>Loading...</div>
  if (!mandate) return (
    <div style={{ color:c.text3, fontSize:13 }}>
      Mandate not found.{' '}
      <button onClick={() => navigate('/sell/processes')} style={{ color:c.green, background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>← Back</button>
    </div>
  )

  const TABS = [
    { id:'overview', label:'Overview' },
    { id:'bids', label:'Bids & Offers' },
    { id:'dataroom', label:'Data Room' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Breadcrumb + header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <button onClick={() => navigate('/sell/processes')}
          style={{ background:'none', border:'none', color:c.text3, cursor:'pointer', fontSize:13, fontFamily:'inherit', padding:0 }}>
          ← Processes
        </button>
        <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
        <span style={{ fontSize:16, fontWeight:600, color:c.text1 }}>{mandate.name}</span>
        <span style={pill(STAGE_COLOR[mandate.stage] || 'gray')}>{mandate.stage}</span>
        {mandate.sector && <span style={{ fontSize:11, color:c.text3 }}>{mandate.sector}</span>}
        {(mandate.ev_low || mandate.ev_high) && (
          <span style={{ fontSize:12, color:c.green, fontFamily:'DM Mono,monospace', marginLeft:'auto' }}>
            {mandate.ev_low && mandate.ev_high ? `$${mandate.ev_low}–${mandate.ev_high}M` : mandate.ev_low ? `$${mandate.ev_low}M+` : `up to $${mandate.ev_high}M`}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid rgba(255,255,255,0.07)', marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 18px', border:'none', borderBottom: tab===t.id ? `2px solid ${c.green}` : '2px solid transparent', background:'transparent', color: tab===t.id ? c.green : c.text3, fontSize:13, fontWeight: tab===t.id ? 500 : 400, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab mandate={mandate} updateMandate={updateMandate} />}
      {tab === 'bids'     && <BidsTab mandate={mandate} />}
      {tab === 'dataroom' && <DataRoomTab mandate={mandate} updateMandate={updateMandate} />}
    </div>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ mandate, updateMandate }) {
  const notesObj = parseNotes(mandate.notes)
  const [summary, setSummary] = useState(notesObj.summary || '')
  const [activity, setActivity] = useState(notesObj.activity || [])
  const [newAct, setNewAct] = useState({ type:'call', note:'' })
  const [contacts, setContacts] = useState(mandate.contacts || [])
  const [checklist, setChecklist] = useState(mandate.checklist || [])
  const [newTask, setNewTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [newContact, setNewContact] = useState({ role:'', name:'' })
  const [addingContact, setAddingContact] = useState(false)
  const [news, setNews] = useState(null)
  const [newsLoading, setNewsLoading] = useState(false)
  const [newsCollapsed, setNewsCollapsed] = useState(false)

  // Valuation & Comps
  const [valuation, setValuation] = useState(null)
  const [valLoading, setValLoading] = useState(false)
  const [valCollapsed, setValCollapsed] = useState(false)

  // Buyer Universe
  const [buyers, setBuyers] = useState(null)
  const [buyerLoading, setBuyerLoading] = useState(false)
  const [buyerCollapsed, setBuyerCollapsed] = useState(false)
  const [buyerTypes, setBuyerTypes] = useState(['PE', 'Strategic', 'Family Office', 'Growth Equity'])
  const { buyers: trackedBuyers, addBuyer } = useBuyers(mandate.id)

  // Email generator
  const [emailBuyer, setEmailBuyer] = useState('')
  const [emailResult, setEmailResult] = useState(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailCopied, setEmailCopied] = useState(false)

  const summaryTimer = useRef(null)

  // Sync if mandate changes (e.g. after save)
  useEffect(() => {
    const obj = parseNotes(mandate.notes)
    setSummary(obj.summary || '')
    setActivity(obj.activity || [])
    setContacts(mandate.contacts || [])
    setChecklist(mandate.checklist || [])
  }, [mandate.id])

  const saveNotePatch = (patch) => {
    const existing = parseNotes(mandate.notes)
    updateMandate(mandate.id, { notes: serializeNotes({ ...existing, ...patch }) })
  }

  const handleSummaryChange = (val) => {
    setSummary(val)
    clearTimeout(summaryTimer.current)
    summaryTimer.current = setTimeout(() => saveNotePatch({ summary: val }), 1000)
  }

  // Activity
  const addActivity = () => {
    if (!newAct.note.trim()) return
    const entry = { id: crypto.randomUUID(), type: newAct.type, note: newAct.note.trim(), date: new Date().toISOString() }
    const next = [entry, ...activity]
    setActivity(next)
    setNewAct({ type:'call', note:'' })
    saveNotePatch({ activity: next })
  }
  const removeActivity = (aid) => {
    const next = activity.filter(a => a.id !== aid)
    setActivity(next)
    saveNotePatch({ activity: next })
  }

  // Checklist
  const toggleTask = async (idx) => {
    const next = checklist.map((t, i) => i===idx ? {...t, done: !t.done} : t)
    setChecklist(next)
    await updateMandate(mandate.id, { checklist: next })
  }
  const addTask = async () => {
    if (!newTask.trim()) return
    const next = [...checklist, { label: newTask.trim(), done: false }]
    setChecklist(next)
    await updateMandate(mandate.id, { checklist: next })
    setNewTask(''); setAddingTask(false)
  }
  const removeTask = async (idx) => {
    const next = checklist.filter((_, i) => i!==idx)
    setChecklist(next)
    await updateMandate(mandate.id, { checklist: next })
  }

  // Contacts
  const addContact = async () => {
    if (!newContact.name.trim()) return
    const next = [...contacts, { ...newContact }]
    setContacts(next)
    await updateMandate(mandate.id, { contacts: next })
    setNewContact({ role:'', name:'' }); setAddingContact(false)
  }
  const removeContact = async (idx) => {
    const next = contacts.filter((_, i) => i!==idx)
    setContacts(next)
    await updateMandate(mandate.id, { contacts: next })
  }

  // Stage
  const setStage = (stage) => updateMandate(mandate.id, { stage })

  // Market Intelligence
  const loadNews = async () => {
    setNewsLoading(true)
    try {
      const res = await fetch('/api/deal-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: {
          company_name: mandate.name,
          sector: mandate.sector,
          stage: mandate.stage,
          raise_amount: null,
          valuation: mandate.ev_low ? mandate.ev_low * 1e6 : null,
          notes: summary,
          memo: summary,
        }}),
      })
      const data = await res.json()
      if (!data.error) setNews(data)
    } catch {}
    setNewsLoading(false)
  }

  // Valuation & Comps
  const loadValuation = async () => {
    setValLoading(true)
    try {
      const res = await fetch('/api/sell?action=valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandate: {
          name: mandate.name,
          sector: mandate.sector,
          stage: mandate.stage,
          ev_low: mandate.ev_low,
          ev_high: mandate.ev_high,
          summary,
        }}),
      })
      const data = await res.json()
      if (!data.error) setValuation(data)
    } catch {}
    setValLoading(false)
  }

  // Buyer Universe
  const toggleBuyerType = (t) => setBuyerTypes(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t])
  const loadBuyers = async () => {
    setBuyerLoading(true)
    try {
      const res = await fetch('/api/find-buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal: {
          company_name: mandate.name,
          sector: mandate.sector,
          stage: mandate.stage,
          valuation: mandate.ev_low ? mandate.ev_low * 1e6 : null,
          notes: summary,
        }, types: buyerTypes }),
      })
      const data = await res.json()
      if (!data.error) setBuyers(Array.isArray(data) ? data : data.buyers || [])
    } catch {}
    setBuyerLoading(false)
  }

  // Email generator
  const generateEmail = async () => {
    if (!emailBuyer.trim()) return
    setEmailLoading(true); setEmailResult(null)
    try {
      const res = await fetch('/api/sell?action=email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandate: {
          name: mandate.name,
          sector: mandate.sector,
          ev_low: mandate.ev_low,
          ev_high: mandate.ev_high,
          stage: mandate.stage,
          lead_advisor: mandate.lead_advisor,
          summary,
        }, buyer_name: emailBuyer }),
      })
      const data = await res.json()
      if (!data.error) setEmailResult(data)
    } catch {}
    setEmailLoading(false)
  }
  const copyEmail = () => {
    if (!emailResult) return
    navigator.clipboard.writeText(`Subject: ${emailResult.subject}\n\n${emailResult.body}`)
    setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:14, alignItems:'flex-start' }}>
      {/* ── Left column ── */}
      <div>
        {/* Business summary */}
        <div style={s.card}>
          <span style={s.label}>Business Summary & Notes</span>
          <textarea
            style={{ ...s.input, minHeight:140, resize:'vertical', lineHeight:1.7 }}
            placeholder="Write your mandate summary, process notes, key observations, risks..."
            value={summary}
            onChange={e => handleSummaryChange(e.target.value)}
          />
        </div>

        {/* Activity log */}
        <div style={s.card}>
          <span style={s.label}>Activity Log</span>
          {/* Add activity */}
          <div style={{ display:'flex', gap:6, marginBottom:12 }}>
            <select value={newAct.type} onChange={e=>setNewAct(a=>({...a,type:e.target.value}))}
              style={{ ...s.input, width:90, flexShrink:0 }}>
              {ACT_TYPES.map(t=><option key={t} value={t}>{ACT_ICONS[t]} {t}</option>)}
            </select>
            <input value={newAct.note} onChange={e=>setNewAct(a=>({...a,note:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&addActivity()}
              placeholder="Add a note, call log, or update..."
              style={s.input}/>
            <button onClick={addActivity}
              style={{ flexShrink:0, padding:'7px 14px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit' }}>
              Add
            </button>
          </div>
          {activity.length === 0 ? (
            <div style={{ color:c.text3, fontSize:12 }}>No activity logged yet.</div>
          ) : activity.map(a => (
            <div key={a.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'0.5px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{ACT_ICONS[a.type] || '📝'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:'#ccc', lineHeight:1.5 }}>{a.note}</div>
                <div style={{ fontSize:10, color:c.text3, marginTop:2 }}>{new Date(a.date).toLocaleDateString()} · {a.type}</div>
              </div>
              <button onClick={()=>removeActivity(a.id)} style={s.iconBtn}>×</button>
            </div>
          ))}
        </div>

        {/* Market Intelligence */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom: newsCollapsed ? 0 : 14 }}
            onClick={() => setNewsCollapsed(x=>!x)}>
            <div>
              <span style={s.label}>Market Intelligence</span>
              {!newsCollapsed && <div style={{ color:'#444', fontSize:11, marginTop:-8, marginBottom:4 }}>Comparable transactions · Active buyers · Sector trends</div>}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {!newsCollapsed && (
                <button onClick={e=>{e.stopPropagation(); loadNews()}} disabled={newsLoading}
                  style={{ padding:'4px 12px', borderRadius:6, border:`0.5px solid rgba(255,255,255,0.11)`, background:'transparent', color:c.text2, cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                  {newsLoading ? 'Loading…' : news ? '↺ Refresh' : '✦ Load Intel'}
                </button>
              )}
              <span style={{ color:'#333', fontSize:12 }}>{newsCollapsed ? '▸' : '▾'}</span>
            </div>
          </div>
          {!newsCollapsed && !newsLoading && !news && (
            <div style={{ color:c.text3, fontSize:12 }}>Click "Load Intel" to pull market data for {mandate.sector || mandate.name}.</div>
          )}
          {newsLoading && <div style={{ color:c.text3, fontSize:12 }}>Pulling market intelligence…</div>}
          {!newsCollapsed && news && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Comparable deals */}
              {news.comparable_deals?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Comparable Transactions</div>
                  {news.comparable_deals.map((d, i) => (
                    <div key={i} style={{ padding:'10px 12px', background:'#141414', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, marginBottom:6 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:'#f0f0f0' }}>{d.company}</span>
                        <span style={{ fontSize:11, color:c.green, fontFamily:'DM Mono,monospace' }}>{d.amount}</span>
                      </div>
                      <div style={{ fontSize:11, color:c.text3, marginBottom:3 }}>{d.date}{d.investors?.length ? ` · ${d.investors.slice(0,2).join(', ')}` : ''}</div>
                      <div style={{ fontSize:11, color:c.text2, lineHeight:1.4 }}>{d.relevance}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* Active buyers */}
              {news.active_investors?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Active Buyers in Sector</div>
                  {news.active_investors.map((inv, i) => (
                    <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<news.active_investors.length-1?'0.5px solid rgba(255,255,255,0.06)':'none' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:3 }}>
                          <span style={{ fontSize:12, fontWeight:500, color:'#f0f0f0' }}>{inv.name}</span>
                          <span style={{ fontSize:10, color:c.blue, border:`0.5px solid rgba(126,166,224,0.2)`, borderRadius:4, padding:'1px 6px' }}>{inv.type}</span>
                        </div>
                        <div style={{ fontSize:11, color:c.text3, lineHeight:1.4 }}>{inv.recent_activity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Market trends */}
              {news.market_trends?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Sector Trends</div>
                  {news.market_trends.map((t, i) => (
                    <div key={i} style={{ padding:'8px 0', borderBottom:i<news.market_trends.length-1?'0.5px solid rgba(255,255,255,0.06)':'none' }}>
                      <div style={{ fontSize:12, fontWeight:500, color:'#f0f0f0', marginBottom:3 }}>{t.trend}</div>
                      <div style={{ fontSize:11, color:c.text3, lineHeight:1.4 }}>{t.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Valuation & Comps */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom: valCollapsed ? 0 : 14 }}
            onClick={() => setValCollapsed(x=>!x)}>
            <div>
              <span style={s.label}>Valuation & Comps</span>
              {!valCollapsed && <div style={{ color:'#444', fontSize:11, marginTop:-8, marginBottom:4 }}>AI-driven EV analysis · Sponsor ranges · Comparable transactions</div>}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              {!valCollapsed && (
                <button onClick={e=>{e.stopPropagation(); loadValuation()}} disabled={valLoading}
                  style={{ padding:'4px 12px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text2, cursor:'pointer', fontSize:11, fontFamily:'inherit' }}>
                  {valLoading ? 'Loading…' : valuation ? '↺ Refresh' : '✦ Run Analysis'}
                </button>
              )}
              <span style={{ color:'#333', fontSize:12 }}>{valCollapsed ? '▸' : '▾'}</span>
            </div>
          </div>
          {!valCollapsed && !valLoading && !valuation && (
            <div style={{ color:c.text3, fontSize:12 }}>Click "Run Analysis" to generate valuation guidance and comparable transactions.</div>
          )}
          {valLoading && <div style={{ color:c.text3, fontSize:12 }}>Generating valuation analysis…</div>}
          {!valCollapsed && valuation && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {/* EV summary */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                {[
                  { label:'EV Low', value: valuation.ev_low ? fmt(valuation.ev_low) : '—' },
                  { label:'EV Mid', value: valuation.ev_mid ? fmt(valuation.ev_mid) : '—' },
                  { label:'EV High', value: valuation.ev_high ? fmt(valuation.ev_high) : '—' },
                ].map(kv => (
                  <div key={kv.label} style={{ background:'#141414', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:9, color:'#444', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{kv.label}</div>
                    <div style={{ fontSize:15, fontWeight:600, color:c.green, fontFamily:'DM Mono,monospace' }}>{kv.value}</div>
                  </div>
                ))}
              </div>
              {valuation.sponsor_range && (
                <div style={{ fontSize:12, color:c.text2 }}>Sponsor range: <span style={{ color:c.text1, fontWeight:500 }}>{valuation.sponsor_range}</span></div>
              )}
              {valuation.strategic_premium && (
                <div style={{ fontSize:12, color:c.text2 }}>Strategic premium: <span style={{ color:c.text1, fontWeight:500 }}>{valuation.strategic_premium}</span></div>
              )}
              {valuation.key_drivers?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Key Value Drivers</div>
                  {valuation.key_drivers.map((d,i) => (
                    <div key={i} style={{ fontSize:12, color:c.text2, padding:'3px 0', borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>· {d}</div>
                  ))}
                </div>
              )}
              {valuation.risks?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Key Risks</div>
                  {valuation.risks.map((r,i) => (
                    <div key={i} style={{ fontSize:12, color:'#f87171', padding:'3px 0', borderBottom:'0.5px solid rgba(255,255,255,0.05)' }}>· {r}</div>
                  ))}
                </div>
              )}
              {valuation.comps?.length > 0 && (
                <div>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Comparable Transactions</div>
                  {valuation.comps.map((co,i) => (
                    <div key={i} style={{ padding:'8px 10px', background:'#141414', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:6, marginBottom:5 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                        <span style={{ fontSize:12, fontWeight:500, color:'#f0f0f0' }}>{co.company || co.name}</span>
                        <span style={{ fontSize:11, color:c.green, fontFamily:'DM Mono,monospace' }}>{co.ev || co.amount || co.multiple}</span>
                      </div>
                      {co.detail && <div style={{ fontSize:11, color:c.text3 }}>{co.detail}</div>}
                    </div>
                  ))}
                </div>
              )}
              {valuation.rationale && (
                <div style={{ fontSize:12, color:c.text2, lineHeight:1.6, padding:'10px 12px', background:'#141414', borderRadius:8, border:'0.5px solid rgba(255,255,255,0.07)' }}>{valuation.rationale}</div>
              )}
            </div>
          )}
        </div>

        {/* Buyer Universe */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', marginBottom: buyerCollapsed ? 0 : 14 }}
            onClick={() => setBuyerCollapsed(x=>!x)}>
            <div>
              <span style={s.label}>Buyer Universe</span>
              {!buyerCollapsed && <div style={{ color:'#444', fontSize:11, marginTop:-8, marginBottom:4 }}>AI-suggested acquirers by type</div>}
            </div>
            <span style={{ color:'#333', fontSize:12 }}>{buyerCollapsed ? '▸' : '▾'}</span>
          </div>
          {!buyerCollapsed && (
            <>
              {/* Type filter */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
                {['PE', 'Strategic', 'Family Office', 'Growth Equity'].map(t => (
                  <button key={t} onClick={e=>{e.stopPropagation(); toggleBuyerType(t)}}
                    style={{ fontSize:10, padding:'3px 10px', borderRadius:99, border:`0.5px solid ${buyerTypes.includes(t) ? 'rgba(123,199,94,0.4)' : 'rgba(255,255,255,0.1)'}`, background: buyerTypes.includes(t) ? 'rgba(123,199,94,0.12)' : 'transparent', color: buyerTypes.includes(t) ? c.green : c.text3, cursor:'pointer', fontFamily:'inherit' }}>
                    {t}
                  </button>
                ))}
                <button onClick={e=>{e.stopPropagation(); loadBuyers()}} disabled={buyerLoading || buyerTypes.length === 0}
                  style={{ fontSize:10, padding:'3px 12px', borderRadius:99, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text2, cursor:'pointer', fontFamily:'inherit', marginLeft:'auto' }}>
                  {buyerLoading ? 'Loading…' : buyers ? '↺ Refresh' : '✦ Find Buyers'}
                </button>
              </div>
              {!buyers && !buyerLoading && <div style={{ color:c.text3, fontSize:12 }}>Select buyer types and click "Find Buyers".</div>}
              {buyerLoading && <div style={{ color:c.text3, fontSize:12 }}>Identifying potential acquirers…</div>}
              {buyers && buyers.map((b, i) => {
                const isTracked = trackedBuyers.some(tb => tb.name?.toLowerCase() === b.name?.toLowerCase())
                return (
                  <div key={i} style={{ padding:'10px 12px', background:'#141414', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, marginBottom:6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                      <div>
                        <span style={{ fontSize:12, fontWeight:600, color:'#f0f0f0' }}>{b.name}</span>
                        <span style={{ fontSize:10, color:c.blue, border:'0.5px solid rgba(126,166,224,0.2)', borderRadius:4, padding:'1px 6px', marginLeft:6 }}>{b.type}</span>
                      </div>
                      {isTracked ? (
                        <span style={{ fontSize:10, color:c.green }}>✓ Tracked</span>
                      ) : (
                        <button onClick={() => addBuyer({ name:b.name, type:b.type, status:'Identified', nda:false, mgmt_meeting:false })}
                          style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:`0.5px solid rgba(123,199,94,0.3)`, background:'rgba(123,199,94,0.08)', color:c.green, cursor:'pointer', fontFamily:'inherit' }}>
                          + Track
                        </button>
                      )}
                    </div>
                    {b.thesis && <div style={{ fontSize:11, color:c.text2, lineHeight:1.5, marginBottom:4 }}>{b.thesis}</div>}
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {b.contact_name && <span style={{ fontSize:10, color:c.text3 }}>Contact: {b.contact_name}</span>}
                      {b.email && <a href={`mailto:${b.email}`} style={{ fontSize:10, color:c.blue, textDecoration:'none' }}>{b.email}</a>}
                      {b.website && <a href={b.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:c.text3, textDecoration:'none' }}>↗ Website</a>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Right sidebar ── */}
      <div>
        {/* Mandate details */}
        <div style={s.card}>
          <span style={s.label}>Mandate Details</span>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              ['Stage', mandate.stage],
              ['Sector', mandate.sector],
              ['EV Low', mandate.ev_low ? `$${mandate.ev_low}M` : null],
              ['EV High', mandate.ev_high ? `$${mandate.ev_high}M` : null],
              ['Lead Advisor', mandate.lead_advisor],
            ].filter(([,v]) => v).map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', borderBottom:'0.5px solid rgba(255,255,255,0.05)', paddingBottom:6 }}>
                <span style={s.metaKey}>{k}</span>
                <span style={s.metaVal}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Process timeline */}
        <div style={s.card}>
          <span style={s.label}>Process Stage</span>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            {STAGES.map((step, i) => {
              const st = stageStatus(mandate.stage, step)
              return (
                <button key={step} onClick={() => setStage(step)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', borderRadius:6, border:'none', background: st==='active' ? 'rgba(133,79,11,0.15)' : 'transparent', cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%' }}>
                  <div style={{ width:16, height:16, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:600,
                    background: st==='done' ? '#3B6D11' : st==='active' ? '#854F0B' : '#202020',
                    border: st==='pending' ? '1px solid rgba(255,255,255,0.11)' : 'none',
                    color: '#fff' }}>
                    {st==='done' ? '✓' : st==='active' ? '●' : ''}
                  </div>
                  <span style={{ fontSize:12, color: st==='active' ? '#f0a050' : st==='done' ? c.text2 : c.text3, fontWeight: st==='active' ? 500 : 400 }}>{step}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Checklist */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={s.label}>Process Checklist</span>
            <button onClick={() => setAddingTask(true)} style={{ fontSize:11, color:c.green, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:-8 }}>+ Add</button>
          </div>
          {checklist.length === 0 && !addingTask && <div style={{ fontSize:12, color:c.text3 }}>No tasks yet.</div>}
          {checklist.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'6px 0', borderBottom:i<checklist.length-1?'0.5px solid rgba(255,255,255,0.06)':'none' }}>
              <div onClick={() => toggleTask(i)}
                style={{ width:14, height:14, borderRadius:3, flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', background:item.done?'#3B6D11':'transparent', border:item.done?'none':'0.5px solid rgba(255,255,255,0.11)', cursor:'pointer' }}>
                {item.done && <span style={{ color:'#fff', fontSize:8 }}>✓</span>}
              </div>
              <div style={{ fontSize:12, color:item.done?c.text3:c.text1, flex:1, textDecoration:item.done?'line-through':'none', lineHeight:1.4 }}>{item.label}</div>
              <button onClick={() => removeTask(i)} style={s.iconBtn}>×</button>
            </div>
          ))}
          {addingTask && (
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Task..."
                style={{ flex:1, ...s.input }}/>
              <button onClick={addTask} style={{ padding:'5px 10px', borderRadius:5, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:11, fontWeight:600 }}>Add</button>
              <button onClick={()=>setAddingTask(false)} style={{ padding:'5px 8px', borderRadius:5, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text3, cursor:'pointer', fontSize:11 }}>✕</button>
            </div>
          )}
        </div>

        {/* Key contacts */}
        <div style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <span style={s.label}>Key Contacts</span>
            <button onClick={() => setAddingContact(true)} style={{ fontSize:11, color:c.green, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', marginTop:-8 }}>+ Add</button>
          </div>
          {contacts.length === 0 && !addingContact && <div style={{ fontSize:12, color:c.text3 }}>No contacts yet.</div>}
          {contacts.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:i<contacts.length-1?'0.5px solid rgba(255,255,255,0.06)':'none' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:'#f0f0f0' }}>{item.name}</div>
                {item.role && <div style={{ fontSize:10, color:c.text3 }}>{item.role}</div>}
              </div>
              <button onClick={() => removeContact(i)} style={s.iconBtn}>×</button>
            </div>
          ))}
          {addingContact && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
              <input autoFocus value={newContact.role} onChange={e=>setNewContact(nc=>({...nc,role:e.target.value}))} placeholder="Role"
                style={s.input}/>
              <input value={newContact.name} onChange={e=>setNewContact(nc=>({...nc,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addContact()} placeholder="Name"
                style={s.input}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={addContact} style={{ padding:'5px 10px', borderRadius:5, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:11, fontWeight:600 }}>Add</button>
                <button onClick={()=>setAddingContact(false)} style={{ padding:'5px 8px', borderRadius:5, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text3, cursor:'pointer', fontSize:11 }}>✕</button>
              </div>
            </div>
          )}
        </div>

        {/* Email Generator */}
        <div style={s.card}>
          <span style={s.label}>Outreach Email</span>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <div>
              <div style={{ fontSize:10, color:'#444', marginBottom:4 }}>Buyer / Recipient</div>
              {trackedBuyers.length > 0 ? (
                <select value={emailBuyer} onChange={e=>setEmailBuyer(e.target.value)} style={s.input}>
                  <option value=''>Select a tracked buyer…</option>
                  {trackedBuyers.map((b,i) => <option key={i} value={b.name}>{b.name}</option>)}
                  <option value='__custom'>Other (type below)</option>
                </select>
              ) : null}
              {(emailBuyer === '__custom' || trackedBuyers.length === 0) && (
                <input value={emailBuyer === '__custom' ? '' : emailBuyer}
                  onChange={e => setEmailBuyer(e.target.value)}
                  placeholder="Enter buyer / fund name"
                  style={{ ...s.input, marginTop: trackedBuyers.length > 0 ? 6 : 0 }} />
              )}
            </div>
            <button onClick={generateEmail} disabled={emailLoading || !emailBuyer.trim() || emailBuyer === '__custom'}
              style={{ padding:'7px 14px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:'inherit', opacity: (!emailBuyer.trim() || emailBuyer==='__custom') ? 0.4 : 1 }}>
              {emailLoading ? 'Generating…' : '✦ Generate Email'}
            </button>
            {emailResult && (
              <div style={{ background:'#141414', border:'0.5px solid rgba(255,255,255,0.07)', borderRadius:8, padding:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <div style={{ fontSize:10, color:'#444', textTransform:'uppercase', letterSpacing:'0.07em' }}>Generated Email</div>
                  <button onClick={copyEmail}
                    style={{ fontSize:10, padding:'3px 8px', borderRadius:5, border:`0.5px solid rgba(255,255,255,0.11)`, background:'transparent', color: emailCopied ? c.green : c.text2, cursor:'pointer', fontFamily:'inherit' }}>
                    {emailCopied ? '✓ Copied' : '↗ Copy'}
                  </button>
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:c.text1, marginBottom:6 }}>Subject: {emailResult.subject}</div>
                <div style={{ fontSize:11, color:c.text2, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{emailResult.body}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bids Tab ──────────────────────────────────────────────────────────────────
function BidsTab({ mandate }) {
  const { bids, addBid, updateBid, deleteBid } = useBids(mandate.id)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK_BID)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openAdd = () => { setForm(BLANK_BID); setModal('add') }
  const openEdit = (b) => { setForm({ buyer_name:b.buyer_name, amount:b.amount||'', multiple:b.multiple||'', structure:b.structure, rollover_pct:b.rollover_pct||'', status:b.status }); setModal(b) }
  const handleSave = async () => {
    if (!form.buyer_name.trim()) return
    setSaving(true)
    const payload = { ...form, amount: form.amount ? Number(form.amount) : null, rollover_pct: form.rollover_pct ? Number(form.rollover_pct) : null }
    if (modal === 'add') await addBid(payload); else await updateBid(modal.id, payload)
    setSaving(false); setModal(null)
  }

  const highBid = bids.reduce((m, b) => (b.amount||0) > (m?.amount||0) ? b : m, null)
  const amounts = bids.filter(b => b.amount).map(b => b.amount)
  const median = amounts.length ? amounts.sort((a,b)=>a-b)[Math.floor(amounts.length/2)] : null
  const evRange = mandate.ev_low && mandate.ev_high ? `$${mandate.ev_low}–${mandate.ev_high}M` : '—'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:10 }}>
        {[
          { label:'High bid', value: highBid ? fmt(highBid.amount) : '—', sub: highBid?.buyer_name||'' },
          { label:'Median bid', value: median ? fmt(median) : '—', sub: `${bids.length} bid${bids.length!==1?'s':''}` },
          { label:'Seller EV range', value: evRange, sub: 'board guidance' },
          { label:'Bids received', value: bids.length, sub: 'total' },
        ].map(k => (
          <div key={k.label} style={kpi.card}>
            <div style={kpi.label}>{k.label}</div>
            <div style={kpi.value}>{k.value}</div>
            <div style={kpi.sub}>{k.sub}</div>
          </div>
        ))}
      </div>
      <div style={panel.wrap}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div style={panel.title}>Bid comparison</div>
          <button onClick={openAdd} style={{ fontSize:12, padding:'5px 12px', borderRadius:6, border:'none', background:'#f0f0f0', color:'#0f0f0f', cursor:'pointer', fontWeight:500, fontFamily:'inherit' }}>+ Add bid</button>
        </div>
        {bids.length === 0 ? <div style={{ color:c.text3, fontSize:13 }}>No bids yet.</div> : (
          <>
            <div style={{ ...table.row, gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px', paddingBottom:8, borderBottom:'0.5px solid rgba(255,255,255,0.11)' }}>
              {['Buyer','Bid','EV/EBITDA','Structure','Rollover','Status',''].map(h=><span key={h} style={table.header}>{h}</span>)}
            </div>
            {bids.map(b => (
              <div key={b.id} style={{ ...table.row, gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px', cursor:'pointer' }} onClick={()=>openEdit(b)}>
                <div style={table.name}>{b.buyer_name}</div>
                <div style={table.mono}>{fmt(b.amount)}</div>
                <div style={{ ...table.mono, fontSize:12 }}>{b.multiple||'—'}</div>
                <div style={{ fontSize:11, color:c.text2 }}>{b.structure}</div>
                <div style={{ fontSize:11, color:c.text2 }}>{b.rollover_pct ? `${b.rollover_pct}%` : '—'}</div>
                <div><span style={pill(BID_STATUS_COLOR[b.status]||'gray')}>{b.status}</span></div>
                <button onClick={e=>{e.stopPropagation(); if(confirm('Remove bid?')) deleteBid(b.id)}} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:14 }}>×</button>
              </div>
            ))}
          </>
        )}
      </div>
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={()=>setModal(null)}>
          <div style={{ background:'#141414', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:12, padding:28, width:440, display:'flex', flexDirection:'column', gap:14 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:500, color:c.text1 }}>{modal==='add'?'Add bid':'Edit bid'}</div>
            <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Buyer name</div>
              <input autoFocus value={form.buyer_name} onChange={e=>set('buyer_name',e.target.value)} placeholder="e.g. KKR" style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Bid amount ($M)</div>
                <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="e.g. 195" style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/></div>
              <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>EV/EBITDA multiple</div>
                <input value={form.multiple} onChange={e=>set('multiple',e.target.value)} placeholder="e.g. 17.2x" style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Structure</div>
                <select value={form.structure} onChange={e=>set('structure',e.target.value)} style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                  {BID_STRUCTURES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Rollover %</div>
                <input type="number" value={form.rollover_pct} onChange={e=>set('rollover_pct',e.target.value)} placeholder="e.g. 10" style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/></div>
            </div>
            <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Status</div>
              <select value={form.status} onChange={e=>set('status',e.target.value)} style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                {BID_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'7px 16px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:'#888', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'7px 16px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>{saving?'Saving...':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Data Room Tab ─────────────────────────────────────────────────────────────
function DataRoomTab({ mandate, updateMandate }) {
  const { buyers } = useBuyers(mandate.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', folder:'Financials' })
  const [saving, setSaving] = useState(false)

  const getDataroom = () => { try { return parseNotes(mandate.notes)?.dataroom || [] } catch { return [] } }
  const saveDataroom = async (updated) => {
    const existing = parseNotes(mandate.notes)
    await updateMandate(mandate.id, { notes: serializeNotes({ ...existing, dataroom: updated }) })
  }

  const dataroom = getDataroom()
  const addDoc = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await saveDataroom([...dataroom, { ...form, added: new Date().toISOString() }])
    setForm({ name:'', folder:'Financials' }); setModal(false); setSaving(false)
  }
  const removeDoc = async (i) => saveDataroom(dataroom.filter((_, idx) => idx !== i))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr)', gap:14 }}>
        <div style={panel.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={panel.title}>Documents</div>
            <button onClick={()=>setModal(true)} style={{ fontSize:12, padding:'5px 12px', borderRadius:6, border:'none', background:'#f0f0f0', color:'#0f0f0f', cursor:'pointer', fontWeight:500, fontFamily:'inherit' }}>+ Add document</button>
          </div>
          {dataroom.length === 0 ? <div style={{ color:c.text3, fontSize:13 }}>No documents tracked yet.</div> : (
            <>
              <div style={{ ...table.row, gridTemplateColumns:'1fr 90px 130px 28px', paddingBottom:8, borderBottom:'0.5px solid rgba(255,255,255,0.11)' }}>
                {['Document','Folder','Added',''].map(h=><span key={h} style={table.header}>{h}</span>)}
              </div>
              {dataroom.map((d, i) => (
                <div key={i} style={{ ...table.row, gridTemplateColumns:'1fr 90px 130px 28px', borderBottom:i<dataroom.length-1?'0.5px solid rgba(255,255,255,0.07)':'none' }}>
                  <div style={{ fontSize:12, fontWeight:500, color:c.text1 }}>{d.name}</div>
                  <div style={{ fontSize:11, color:c.text3 }}>{d.folder}</div>
                  <div style={{ fontSize:11, color:c.text3 }}>{d.added ? new Date(d.added).toLocaleDateString() : '—'}</div>
                  <button onClick={()=>removeDoc(i)} style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:14 }}>×</button>
                </div>
              ))}
            </>
          )}
        </div>
        <div style={panel.wrap}>
          <div style={panel.title}>Buyer Engagement</div>
          <div style={{ marginTop:12 }}>
            {buyers.length === 0 ? <div style={{ color:c.text3, fontSize:12 }}>Add buyers in the Buyer Universe tab.</div>
              : buyers.map(b => (
              <div key={b.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:c.text1 }}>{b.name}</span>
                  <span style={{ fontSize:11, color:c.text3 }}>{b.status}</span>
                </div>
                <div style={{ height:4, background:'#202020', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${b.nda?(b.mgmt_meeting?80:50):20}%`, background:c.blue, opacity:0.7, borderRadius:99 }}/>
                </div>
                <div style={{ fontSize:10, color:c.text3, marginTop:3 }}>
                  {b.nda?'NDA signed':'No NDA'}{b.mgmt_meeting?' · Mgmt meeting held':''}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={()=>setModal(false)}>
          <div style={{ background:'#141414', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:12, padding:28, width:400, display:'flex', flexDirection:'column', gap:14 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:500, color:c.text1 }}>Add document</div>
            <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Document name</div>
              <input autoFocus value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Financial model"
                style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/></div>
            <div><div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Folder</div>
              <select value={form.folder} onChange={e=>setForm(f=>({...f,folder:e.target.value}))} style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                {FOLDERS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'7px 16px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:'#888', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
              <button onClick={addDoc} disabled={saving} style={{ padding:'7px 16px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>{saving?'Saving...':'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
