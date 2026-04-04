import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { useBids, useBuyers } from '../../hooks/useSellSide'
import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

const STAGES = ['Prep phase', 'NDA / CIM', 'Mgmt meetings', 'First round bids', 'Final round', 'Exclusivity', 'Sign & close']
const STAGE_COLOR = { 'Prep phase':'gray','NDA / CIM':'blue','Mgmt meetings':'blue','First round bids':'amber','Final round':'amber','Exclusivity':'green','Sign & close':'green' }
const FOLDERS = ['Financials', 'Commercial', 'Technology', 'Management', 'Legal', 'Diligence', 'Other']
const BID_STATUSES = ['IOI only', 'LOI pending', 'Final round', 'Exclusivity', 'Withdrawn']
const BID_STATUS_COLOR = { 'Final round':'green','LOI pending':'amber','IOI only':'blue','Exclusivity':'green','Withdrawn':'red' }
const BID_STRUCTURES = ['All cash', 'Cash + rollover', 'Cash + stock', 'Cash + earnout', 'Other']
const BLANK_BID = { buyer_name:'', amount:'', multiple:'', structure:'All cash', rollover_pct:'', status:'IOI only' }

const stageStatus = (mandateStage, step) => {
  const mi = STAGES.indexOf(mandateStage), si = STAGES.indexOf(step)
  if (si < mi) return 'done'; if (si === mi) return 'active'; return 'pending'
}
const fmt = (n) => { if (!n) return '—'; if (n >= 1000) return `$${(n/1000).toFixed(1)}B`; return `$${Math.round(n)}M` }

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
      <button onClick={() => navigate('/sell/processes')} style={{ color:c.green, background:'none', border:'none', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>← Back to processes</button>
    </div>
  )

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'bids', label: 'Bids & Offers' },
    { id: 'dataroom', label: 'Data Room' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => navigate('/sell/processes')}
          style={{ background:'none', border:'none', color:c.text3, cursor:'pointer', fontSize:13, fontFamily:'inherit', padding:0 }}>
          ← Processes
        </button>
        <span style={{ color:'rgba(255,255,255,0.15)' }}>/</span>
        <span style={{ fontSize:15, fontWeight:600, color:c.text1 }}>{mandate.name}</span>
        <span style={pill(STAGE_COLOR[mandate.stage] || 'gray')}>{mandate.stage}</span>
        {mandate.sector && <span style={{ fontSize:11, color:c.text3 }}>{mandate.sector}</span>}
        {mandate.lead_advisor && <span style={{ fontSize:11, color:c.text3, marginLeft:'auto' }}>Lead: {mandate.lead_advisor}</span>}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'0.5px solid rgba(255,255,255,0.07)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'8px 18px', border:'none', borderBottom: tab===t.id ? `2px solid ${c.green}` : '2px solid transparent', background:'transparent', color: tab===t.id ? c.green : c.text3, fontSize:13, fontWeight: tab===t.id ? 500 : 400, cursor:'pointer', fontFamily:'inherit' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab mandate={mandate} updateMandate={updateMandate} />}
      {tab === 'bids' && <BidsTab mandate={mandate} />}
      {tab === 'dataroom' && <DataRoomTab mandate={mandate} updateMandate={updateMandate} />}
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ mandate, updateMandate }) {
  const [newContact, setNewContact] = useState({ role:'', name:'' })
  const [newTask, setNewTask] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  const contacts = mandate.contacts || []
  const checklist = mandate.checklist || []

  const toggleTask = async (idx) =>
    updateMandate(mandate.id, { checklist: checklist.map((t, i) => i===idx ? {...t, done: !t.done} : t) })

  const addTask = async () => {
    if (!newTask.trim()) return
    await updateMandate(mandate.id, { checklist: [...checklist, { label: newTask.trim(), done: false }] })
    setNewTask(''); setAddingTask(false)
  }

  const removeTask = async (idx) =>
    updateMandate(mandate.id, { checklist: checklist.filter((_, i) => i!==idx) })

  const addContact = async () => {
    if (!newContact.name.trim()) return
    await updateMandate(mandate.id, { contacts: [...contacts, { ...newContact }] })
    setNewContact({ role:'', name:'' }); setAddingContact(false)
  }

  const removeContact = async (idx) =>
    updateMandate(mandate.id, { contacts: contacts.filter((_, i) => i!==idx) })

  const setStage = async (stage) => updateMandate(mandate.id, { stage })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Process timeline */}
      <div style={panel.wrap}>
        <div style={{ fontSize:12, fontWeight:500, color:c.text2, marginBottom:18 }}>Process timeline</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${STAGES.length},minmax(0,1fr))`, position:'relative' }}>
          {STAGES.map((step, i) => {
            const s = stageStatus(mandate.stage, step)
            const dot = {
              done:    { background:'#3B6D11', color:'#fff' },
              active:  { background:'#854F0B', color:'#fff' },
              pending: { background:'#202020', border:'1.5px solid rgba(255,255,255,0.11)', color:c.text3 },
            }[s]
            return (
              <div key={step} style={{ display:'flex', flexDirection:'column', alignItems:'center', position:'relative', cursor:'pointer' }}
                onClick={() => setStage(step)}>
                {i < STAGES.length-1 && <div style={{ position:'absolute', top:10, left:'50%', width:'100%', height:1, background:'rgba(255,255,255,0.11)', zIndex:0 }}/>}
                <div style={{ width:20, height:20, borderRadius:'50%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:500, ...dot }}>
                  {s==='done' ? '✓' : s==='active' ? '●' : i+1}
                </div>
                <div style={{ fontSize:10, color:s==='active'?c.amber:c.text2, marginTop:6, textAlign:'center', lineHeight:1.4 }}>{step}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:14 }}>
        {/* Checklist */}
        <div style={panel.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={panel.title}>Process checklist</div>
            <button onClick={() => setAddingTask(true)} style={{ fontSize:11, color:c.green, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>+ Add</button>
          </div>
          {checklist.length===0 && !addingTask && <div style={{ fontSize:12, color:c.text3 }}>No tasks yet.</div>}
          {checklist.map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'7px 0', borderBottom:i<checklist.length-1?'0.5px solid rgba(255,255,255,0.07)':'none' }}>
              <div onClick={() => toggleTask(i)}
                style={{ width:15, height:15, borderRadius:4, flexShrink:0, marginTop:1, display:'flex', alignItems:'center', justifyContent:'center', background:item.done?'#3B6D11':'transparent', border:item.done?'none':'0.5px solid rgba(255,255,255,0.11)', cursor:'pointer' }}>
                {item.done && <span style={{ color:'#fff', fontSize:9 }}>✓</span>}
              </div>
              <div style={{ fontSize:12, color:item.done?c.text3:c.text1, flex:1, textDecoration:item.done?'line-through':'none' }}>{item.label}</div>
              <button onClick={() => removeTask(i)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:12, padding:0, lineHeight:1 }}>×</button>
            </div>
          ))}
          {addingTask && (
            <div style={{ display:'flex', gap:6, marginTop:8 }}>
              <input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Task description"
                style={{ flex:1, background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:5, color:'#f0f0f0', fontSize:12, padding:'5px 8px', fontFamily:'inherit' }}/>
              <button onClick={addTask} style={{ fontSize:11, padding:'5px 10px', borderRadius:5, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontWeight:600 }}>Add</button>
              <button onClick={() => setAddingTask(false)} style={{ fontSize:11, padding:'5px 8px', borderRadius:5, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text3, cursor:'pointer' }}>✕</button>
            </div>
          )}
        </div>

        {/* Key contacts */}
        <div style={panel.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div style={panel.title}>Key contacts</div>
            <button onClick={() => setAddingContact(true)} style={{ fontSize:11, color:c.green, background:'none', border:'none', cursor:'pointer', fontFamily:'inherit' }}>+ Add</button>
          </div>
          {contacts.length===0 && !addingContact && <div style={{ fontSize:12, color:c.text3 }}>No contacts yet.</div>}
          {contacts.map((item, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:i<contacts.length-1?'0.5px solid rgba(255,255,255,0.07)':'none' }}>
              <span style={{ fontSize:11, color:c.text3 }}>{item.role}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:500, color:c.text1 }}>{item.name}</span>
                <button onClick={() => removeContact(i)} style={{ background:'none', border:'none', color:'#333', cursor:'pointer', fontSize:12, padding:0 }}>×</button>
              </div>
            </div>
          ))}
          {addingContact && (
            <div style={{ display:'flex', flexDirection:'column', gap:6, marginTop:8 }}>
              <input autoFocus value={newContact.role} onChange={e=>setNewContact(c=>({...c,role:e.target.value}))} placeholder="Role (e.g. Lead advisor)"
                style={{ background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:5, color:'#f0f0f0', fontSize:12, padding:'5px 8px', fontFamily:'inherit' }}/>
              <input value={newContact.name} onChange={e=>setNewContact(c=>({...c,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addContact()} placeholder="Name"
                style={{ background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:5, color:'#f0f0f0', fontSize:12, padding:'5px 8px', fontFamily:'inherit' }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={addContact} style={{ fontSize:11, padding:'5px 10px', borderRadius:5, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontWeight:600 }}>Add</button>
                <button onClick={() => setAddingContact(false)} style={{ fontSize:11, padding:'5px 8px', borderRadius:5, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:c.text3, cursor:'pointer' }}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bids & Offers ─────────────────────────────────────────────────────────────
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
    if (modal === 'add') await addBid(payload)
    else await updateBid(modal.id, payload)
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
          { label:'High bid', value: highBid ? fmt(highBid.amount) : '—', sub: highBid?.buyer_name || '' },
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
        {bids.length === 0 ? (
          <div style={{ color:c.text3, fontSize:13 }}>No bids yet.</div>
        ) : (
          <>
            <div style={{ ...table.row, gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px', paddingBottom:8, borderBottom:'0.5px solid rgba(255,255,255,0.11)' }}>
              {['Buyer','Bid','EV/EBITDA','Structure','Rollover','Status',''].map(h=><span key={h} style={table.header}>{h}</span>)}
            </div>
            {bids.map(b => (
              <div key={b.id} style={{ ...table.row, gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px', cursor:'pointer' }} onClick={() => openEdit(b)}>
                <div style={table.name}>{b.buyer_name}</div>
                <div style={table.mono}>{fmt(b.amount)}</div>
                <div style={{ ...table.mono, fontSize:12 }}>{b.multiple||'—'}</div>
                <div style={{ fontSize:11, color:c.text2 }}>{b.structure}</div>
                <div style={{ fontSize:11, color:c.text2 }}>{b.rollover_pct ? `${b.rollover_pct}%` : '—'}</div>
                <div><span style={pill(BID_STATUS_COLOR[b.status]||'gray')}>{b.status}</span></div>
                <button onClick={e=>{e.stopPropagation(); if(confirm('Remove bid?')) deleteBid(b.id)}}
                  style={{ background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:14 }}>×</button>
              </div>
            ))}
          </>
        )}
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }} onClick={() => setModal(null)}>
          <div style={{ background:'#141414', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:12, padding:28, width:440, display:'flex', flexDirection:'column', gap:14 }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:14, fontWeight:500, color:c.text1 }}>{modal==='add'?'Add bid':'Edit bid'}</div>
            <div>
              <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Buyer name</div>
              <input autoFocus value={form.buyer_name} onChange={e=>set('buyer_name',e.target.value)} placeholder="e.g. KKR"
                style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Bid amount ($M)</div>
                <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="e.g. 195"
                  style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>
              <div>
                <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>EV/EBITDA multiple</div>
                <input value={form.multiple} onChange={e=>set('multiple',e.target.value)} placeholder="e.g. 17.2x"
                  style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Structure</div>
                <select value={form.structure} onChange={e=>set('structure',e.target.value)}
                  style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                  {BID_STRUCTURES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Rollover %</div>
                <input type="number" value={form.rollover_pct} onChange={e=>set('rollover_pct',e.target.value)} placeholder="e.g. 10"
                  style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/>
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Status</div>
              <select value={form.status} onChange={e=>set('status',e.target.value)}
                style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                {BID_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={()=>setModal(null)} style={{ padding:'7px 16px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:'#888', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'7px 16px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                {saving?'Saving...':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Data Room ─────────────────────────────────────────────────────────────────
function DataRoomTab({ mandate, updateMandate }) {
  const { buyers } = useBuyers(mandate.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', folder:'Financials' })
  const [saving, setSaving] = useState(false)

  let dataroom = []
  try { dataroom = JSON.parse(mandate.notes || '{}')?.dataroom || [] } catch {}

  const saveDataroom = async (updated) => {
    let existing = {}
    try { existing = JSON.parse(mandate.notes || '{}') } catch {}
    await updateMandate(mandate.id, { notes: JSON.stringify({ ...existing, dataroom: updated }) })
  }

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
        {/* Documents */}
        <div style={panel.wrap}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={panel.title}>Documents</div>
            <button onClick={()=>setModal(true)} style={{ fontSize:12, padding:'5px 12px', borderRadius:6, border:'none', background:'#f0f0f0', color:'#0f0f0f', cursor:'pointer', fontWeight:500, fontFamily:'inherit' }}>+ Add document</button>
          </div>
          {dataroom.length === 0 ? (
            <div style={{ color:c.text3, fontSize:13 }}>No documents tracked yet.</div>
          ) : (
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

        {/* Buyer engagement */}
        <div style={panel.wrap}>
          <div style={panel.title}>Buyer engagement</div>
          <div style={{ marginTop:12 }}>
            {buyers.length === 0 ? (
              <div style={{ color:c.text3, fontSize:12 }}>Add buyers in the Buyer Universe tab to track engagement.</div>
            ) : buyers.map(b => (
              <div key={b.id} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, fontWeight:500, color:c.text1 }}>{b.name}</span>
                  <span style={{ fontSize:11, color:c.text3 }}>{b.status}</span>
                </div>
                <div style={{ height:4, background:'#202020', borderRadius:99, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${b.nda ? (b.mgmt_meeting ? 80 : 50) : 20}%`, background:c.blue, opacity:0.7, borderRadius:99 }}/>
                </div>
                <div style={{ fontSize:10, color:c.text3, marginTop:3 }}>
                  {b.nda ? 'NDA signed' : 'No NDA'}{b.mgmt_meeting ? ' · Mgmt meeting held' : ''}
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
            <div>
              <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Document name</div>
              <input autoFocus value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Financial model"
                style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' }}/>
            </div>
            <div>
              <div style={{ fontSize:11, color:'#555', marginBottom:5 }}>Folder</div>
              <select value={form.folder} onChange={e=>setForm(f=>({...f,folder:e.target.value}))}
                style={{ width:'100%', background:'#1a1a1a', border:'0.5px solid rgba(255,255,255,0.11)', borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit' }}>
                {FOLDERS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:4 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'7px 16px', borderRadius:6, border:'0.5px solid rgba(255,255,255,0.11)', background:'transparent', color:'#888', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>Cancel</button>
              <button onClick={addDoc} disabled={saving} style={{ padding:'7px 16px', borderRadius:6, border:'none', background:c.green, color:'#0f0f0f', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit' }}>
                {saving?'Saving...':'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
