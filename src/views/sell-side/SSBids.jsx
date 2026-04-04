import { useState } from 'react'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { useBids } from '../../hooks/useSellSide'
import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

const STATUSES = ['IOI only', 'LOI pending', 'Final round', 'Exclusivity', 'Withdrawn']
const STATUS_COLOR = { 'Final round':'green', 'LOI pending':'amber', 'IOI only':'blue', 'Exclusivity':'green', 'Withdrawn':'red' }
const STRUCTURES = ['All cash', 'Cash + rollover', 'Cash + stock', 'Cash + earnout', 'Other']
const BLANK = { buyer_name:'', amount:'', multiple:'', structure:'All cash', rollover_pct:'', status:'IOI only' }

function fmt(n) { if (!n) return '—'; if (n >= 1000) return `$${(n/1000).toFixed(1)}B`; return `$${Math.round(n)}M` }

export default function SSBids() {
  const { activeMandate, loading: mandateLoading } = useMandateContext()
  const { bids, addBid, updateBid, deleteBid } = useBids(activeMandate?.id)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  if (mandateLoading) return <div style={{color:c.text3,fontSize:13}}>Loading...</div>
  if (!activeMandate) return <div style={{color:c.text3,fontSize:13}}>Select or create a mandate first.</div>

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const openAdd = () => { setForm(BLANK); setModal('add') }
  const openEdit = (b) => { setForm({ buyer_name:b.buyer_name, amount:b.amount||'', multiple:b.multiple||'', structure:b.structure, rollover_pct:b.rollover_pct||'', status:b.status }); setModal(b) }

  const handleSave = async () => {
    if (!form.buyer_name.trim()) return
    setSaving(true)
    const payload = { ...form, amount: form.amount ? Number(form.amount) : null, rollover_pct: form.rollover_pct ? Number(form.rollover_pct) : null }
    if (modal === 'add') await addBid(payload)
    else await updateBid(modal.id, payload)
    setSaving(false)
    setModal(null)
  }

  const highBid = bids.reduce((m, b) => (b.amount || 0) > (m?.amount || 0) ? b : m, null)
  const amounts = bids.filter(b => b.amount).map(b => b.amount)
  const median = amounts.length ? amounts.sort((a,b)=>a-b)[Math.floor(amounts.length/2)] : null
  const evRange = activeMandate.ev_low && activeMandate.ev_high ? `$${activeMandate.ev_low}-${activeMandate.ev_high}M` : '—'

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:10}}>
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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={panel.title}>Bid comparison — {activeMandate.name}</div>
          <button onClick={openAdd} style={{fontSize:12,padding:'5px 12px',borderRadius:6,border:'none',background:'#f0f0f0',color:'#0f0f0f',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>+ Add bid</button>
        </div>
        {bids.length === 0 ? (
          <div style={{color:c.text3,fontSize:13}}>No bids yet.</div>
        ) : (
          <>
            <div style={{...table.row,gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px',paddingBottom:8,borderBottom:'0.5px solid rgba(255,255,255,0.11)'}}>
              {['Buyer','Bid','EV/EBITDA','Structure','Rollover','Status',''].map(h=><span key={h} style={table.header}>{h}</span>)}
            </div>
            {bids.map(b => (
              <div key={b.id} style={{...table.row,gridTemplateColumns:'1fr 80px 90px 130px 80px 120px 40px',cursor:'pointer'}} onClick={()=>openEdit(b)}>
                <div style={table.name}>{b.buyer_name}</div>
                <div style={table.mono}>{fmt(b.amount)}</div>
                <div style={{...table.mono,fontSize:12}}>{b.multiple||'—'}</div>
                <div style={{fontSize:11,color:c.text2}}>{b.structure}</div>
                <div style={{fontSize:11,color:c.text2}}>{b.rollover_pct ? `${b.rollover_pct}%` : '—'}</div>
                <div><span style={pill(STATUS_COLOR[b.status]||'gray')}>{b.status}</span></div>
                <button onClick={e=>{e.stopPropagation(); if(confirm('Remove bid?')) deleteBid(b.id)}}
                  style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:14}}>×</button>
              </div>
            ))}
          </>
        )}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
          <div style={{background:'#141414',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:28,width:440,display:'flex',flexDirection:'column',gap:14}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:500,color:c.text1}}>{modal==='add'?'Add bid':'Edit bid'}</div>
            <div>
              <div style={{fontSize:11,color:'#555',marginBottom:5}}>Buyer name</div>
              <input autoFocus value={form.buyer_name} onChange={e=>set('buyer_name',e.target.value)} placeholder="e.g. KKR"
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>Bid amount ($M)</div>
                <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)} placeholder="e.g. 195"
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>EV/EBITDA multiple</div>
                <input value={form.multiple} onChange={e=>set('multiple',e.target.value)} placeholder="e.g. 17.2x"
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>Structure</div>
                <select value={form.structure} onChange={e=>set('structure',e.target.value)}
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
                  {STRUCTURES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>Rollover %</div>
                <input type="number" value={form.rollover_pct} onChange={e=>set('rollover_pct',e.target.value)} placeholder="e.g. 10"
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            </div>
            <div>
              <div style={{fontSize:11,color:'#555',marginBottom:5}}>Status</div>
              <select value={form.status} onChange={e=>set('status',e.target.value)}
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={()=>setModal(null)} style={{padding:'7px 16px',borderRadius:6,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:'#888',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{padding:'7px 16px',borderRadius:6,border:'none',background:'#7bc75e',color:'#0f0f0f',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
                {saving?'Saving...':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
