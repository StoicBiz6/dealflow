import { createContext, useContext, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { useMandates } from '../../hooks/useSellSide'
import SellSidePanel from './SellSidePanel'

export const MandateContext = createContext(null)
export const useMandateContext = () => useContext(MandateContext)

const NAV = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', path: '/sell/dashboard' }] },
  { group: 'Processes', items: [
    { id: 'processes', label: 'Active Processes', path: '/sell/processes' },
    { id: 'buyers', label: 'Buyer Universe', path: '/sell/buyers' },
  ]},
  { group: 'Deal Room', items: [
    { id: 'bids', label: 'Bids & Offers', path: '/sell/bids' },
    { id: 'dataroom', label: 'Data Room', path: '/sell/dataroom' },
  ]},
]

export default function SellShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()
  const activeId = location.pathname.split('/').pop()
  const { mandates, loading, addMandate, updateMandate, deleteMandate } = useMandates()
  const [activeMandateId, setActiveMandateId] = useState(null)
  const [showNewMandate, setShowNewMandate] = useState(false)

  const activeMandate = mandates.find(m => m.id === activeMandateId) || mandates[0] || null

  return (
    <MandateContext.Provider value={{ mandates, activeMandate, setActiveMandateId, addMandate, updateMandate, deleteMandate, loading }}>
      <div style={{display:'grid',gridTemplateColumns:'224px 1fr',height:'100vh',overflow:'hidden',background:'#0f0f0f',fontFamily:'inherit'}}>
        <aside style={{background:'#141414',borderRight:'0.5px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',height:'100vh'}}>
          <div style={{padding:'1.25rem 1rem 1rem',borderBottom:'0.5px solid rgba(255,255,255,0.07)'}}>
            <div style={{fontSize:10,fontWeight:500,letterSpacing:'0.2em',color:'#555',marginBottom:14}}>DEALFLOW</div>
            <div style={{background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.07)',borderRadius:8,padding:3,display:'flex',gap:2}}>
              <button onClick={() => navigate('/raise')} style={{flex:1,fontSize:11,fontWeight:500,padding:'5px 4px',border:'none',borderRadius:6,background:'transparent',color:'#555',cursor:'pointer',fontFamily:'inherit'}}>Capital Raise</button>
              <button style={{flex:1,fontSize:11,fontWeight:500,padding:'5px 4px',border:'0.5px solid rgba(59,109,17,0.3)',borderRadius:6,background:'#0d2014',color:'#7bc75e',cursor:'pointer',fontFamily:'inherit'}}>Sell Side</button>
            </div>
          </div>

          {/* Mandate selector */}
          <div style={{padding:'0.75rem 1rem',borderBottom:'0.5px solid rgba(255,255,255,0.07)'}}>
            <div style={{fontSize:9,fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#555',marginBottom:6}}>Active Mandate</div>
            {loading ? (
              <div style={{fontSize:12,color:'#555'}}>Loading...</div>
            ) : mandates.length === 0 ? (
              <button onClick={() => setShowNewMandate(true)} style={{fontSize:12,color:'#7bc75e',background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:'inherit'}}>+ New mandate</button>
            ) : (
              <select
                value={activeMandate?.id || ''}
                onChange={e => setActiveMandateId(e.target.value)}
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:12,padding:'5px 8px',fontFamily:'inherit',cursor:'pointer'}}
              >
                {mandates.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
          </div>

          <nav style={{flex:1,overflowY:'auto',padding:'0.5rem 0.75rem 1rem'}}>
            {NAV.map(group => (
              <div key={group.group} style={{marginTop:'1.25rem'}}>
                <div style={{fontSize:9,fontWeight:500,letterSpacing:'0.1em',textTransform:'uppercase',color:'#555',padding:'0 8px',marginBottom:4}}>{group.group}</div>
                {group.items.map(item => (
                  <button key={item.id} onClick={() => navigate(item.path)}
                    style={{display:'flex',alignItems:'center',gap:8,width:'100%',padding:'7px 10px',borderRadius:8,border:activeId===item.id?'0.5px solid rgba(59,109,17,0.25)':'none',background:activeId===item.id?'#0d2014':'transparent',color:activeId===item.id?'#7bc75e':'#888',fontSize:13,textAlign:'left',cursor:'pointer',marginBottom:1,fontFamily:'inherit',fontWeight:activeId===item.id?500:400}}>
                    <span style={{width:5,height:5,borderRadius:'50%',background:'#7bc75e',opacity:0.5,flexShrink:0}}/>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div style={{padding:'0.75rem 1rem',borderTop:'0.5px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:10}}>
            <UserButton afterSignOutUrl="/select" />
            <div>
              <div style={{fontSize:12,fontWeight:500,color:'#f0f0f0'}}>{user?.firstName} {user?.lastName}</div>
              <div style={{fontSize:10,color:'#555',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
        </aside>

        <div style={{display:'grid',gridTemplateRows:'52px 1fr',height:'100vh',overflow:'hidden'}}>
          <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 1.5rem',background:'#0f0f0f',borderBottom:'0.5px solid rgba(255,255,255,0.07)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontSize:15,fontWeight:500,color:'#f0f0f0'}}>
                {NAV.flatMap(g=>g.items).find(i=>i.id===activeId)?.label || 'Dashboard'}
              </span>
              {activeMandate && (
                <span style={{fontSize:10,fontWeight:500,padding:'3px 9px',borderRadius:99,background:'#0d2014',color:'#7bc75e',border:'0.5px solid rgba(59,109,17,0.3)'}}>{activeMandate.name}</span>
              )}
            </div>
            <div style={{display:'flex',gap:8}}>
              {activeMandate && (
                <ShareButton mandate={activeMandate} />
              )}
              <button onClick={() => setShowNewMandate(true)} style={{fontSize:12,padding:'6px 14px',borderRadius:8,border:'none',background:'#f0f0f0',color:'#0f0f0f',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>+ New Mandate</button>
            </div>
          </header>
          <main style={{overflowY:'auto',padding:'1.5rem',background:'#0f0f0f'}}>{children}</main>
        </div>
      </div>

      <SellSidePanel />
      {showNewMandate && <MandateModal onClose={() => setShowNewMandate(false)} onSave={async (data) => { await addMandate(data); setShowNewMandate(false) }} />}
    </MandateContext.Provider>
  )
}

function ShareButton({ mandate }) {
  const [copied, setCopied] = useState(false)
  const share = () => {
    const evRange = mandate.ev_low && mandate.ev_high ? `$${mandate.ev_low}–${mandate.ev_high}M` : mandate.ev_low ? `$${mandate.ev_low}M+` : 'undisclosed'
    const text = [
      `📋 ${mandate.name}`,
      mandate.sector ? `Sector: ${mandate.sector}` : null,
      `EV range: ${evRange}`,
      `Stage: ${mandate.stage}`,
      mandate.lead_advisor ? `Advisor: ${mandate.lead_advisor}` : null,
    ].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={share} style={{fontSize:12,padding:'6px 14px',borderRadius:8,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:copied?'#7bc75e':'#888',cursor:'pointer',fontFamily:'inherit'}}>
      {copied ? '✓ Copied' : '↗ Share'}
    </button>
  )
}

const STAGES = ['Prep phase', 'NDA / CIM', 'Mgmt meetings', 'First round bids', 'Final round', 'Exclusivity', 'Sign & close']

function MandateModal({ onClose, onSave, initial = {} }) {
  const [form, setForm] = useState({ name: '', sector: '', ev_low: '', ev_high: '', stage: 'Prep phase', lead_advisor: '', ...initial })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await onSave({ ...form, ev_low: form.ev_low ? Number(form.ev_low) : null, ev_high: form.ev_high ? Number(form.ev_high) : null })
    setSaving(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={onClose}>
      <div style={{background:'#141414',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:28,width:440,display:'flex',flexDirection:'column',gap:16}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:15,fontWeight:500,color:'#f0f0f0'}}>New Mandate</div>
        {[
          { label: 'Project name', key: 'name', placeholder: 'e.g. Project Falcon' },
          { label: 'Sector', key: 'sector', placeholder: 'e.g. Healthcare SaaS' },
          { label: 'Lead advisor', key: 'lead_advisor', placeholder: 'Name' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <div style={{fontSize:11,color:'#555',marginBottom:5}}>{label}</div>
            <input value={form[key]} onChange={e=>set(key, e.target.value)} placeholder={placeholder}
              style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
        ))}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          <div>
            <div style={{fontSize:11,color:'#555',marginBottom:5}}>EV low ($M)</div>
            <input type="number" value={form.ev_low} onChange={e=>set('ev_low',e.target.value)} placeholder="e.g. 180"
              style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
          <div>
            <div style={{fontSize:11,color:'#555',marginBottom:5}}>EV high ($M)</div>
            <input type="number" value={form.ev_high} onChange={e=>set('ev_high',e.target.value)} placeholder="e.g. 220"
              style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}} />
          </div>
        </div>
        <div>
          <div style={{fontSize:11,color:'#555',marginBottom:5}}>Stage</div>
          <select value={form.stage} onChange={e=>set('stage',e.target.value)}
            style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
          <button onClick={onClose} style={{padding:'7px 16px',borderRadius:6,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:'#888',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{padding:'7px 16px',borderRadius:6,border:'none',background:'#7bc75e',color:'#0f0f0f',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
            {saving ? 'Saving...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
