import { useState } from 'react'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { useBuyers } from '../../hooks/useSellSide'
import { pill, panel, table, c } from '../../components/sell-side/ssStyles'

const STATUSES = ['CIM sent', 'IOI in', 'LOI pending', 'Final round', 'Passed']
const STATUS_COLOR = { 'Final round':'green', 'LOI pending':'amber', 'IOI in':'blue', 'Passed':'red', 'CIM sent':'gray' }
const TYPES = ['Sponsor', 'Strategic', 'Family Office', 'Other']
const AC = ['#0d1f35','#0d2014','#2a1e08','#1a1030','#2a0d0d']
const AT = [c.blue, c.green, c.amber, '#a89cf0', c.red]

const BLANK = { name:'', type:'Sponsor', nda:false, mgmt_meeting:false, status:'CIM sent' }

export default function SSBuyers() {
  const { activeMandate, loading: mandateLoading } = useMandateContext()
  const { buyers, addBuyer, updateBuyer, deleteBuyer } = useBuyers(activeMandate?.id)
  const [modal, setModal] = useState(null) // null | 'add' | buyer object
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  if (mandateLoading) return <div style={{color:c.text3,fontSize:13}}>Loading...</div>
  if (!activeMandate) return <div style={{color:c.text3,fontSize:13}}>Select or create a mandate first.</div>

  const openAdd = () => { setForm(BLANK); setModal('add') }
  const openEdit = (b) => { setForm({ name:b.name, type:b.type, nda:b.nda, mgmt_meeting:b.mgmt_meeting, status:b.status }); setModal(b) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    if (modal === 'add') await addBuyer(form)
    else await updateBuyer(modal.id, form)
    setSaving(false)
    setModal(null)
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={panel.wrap}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={panel.title}>Buyer universe — {activeMandate.name}</div>
          <button onClick={openAdd} style={{fontSize:12,padding:'5px 12px',borderRadius:6,border:'none',background:'#f0f0f0',color:'#0f0f0f',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>+ Add buyer</button>
        </div>
        {buyers.length === 0 ? (
          <div style={{color:c.text3,fontSize:13}}>No buyers yet — add your first buyer.</div>
        ) : (
          <>
            <div style={{...table.row,gridTemplateColumns:'32px 1fr 80px 120px 100px 80px',paddingBottom:8,borderBottom:'0.5px solid rgba(255,255,255,0.11)'}}>
              <span/><span style={table.header}>Buyer</span><span style={table.header}>Type</span>
              <span style={table.header}>Status</span><span style={table.header}>NDA / Mgmt</span><span/>
            </div>
            {buyers.map((b, i) => (
              <div key={b.id} style={{...table.row,gridTemplateColumns:'32px 1fr 80px 120px 100px 80px',cursor:'pointer'}} onClick={() => openEdit(b)}>
                <div style={{width:28,height:28,borderRadius:'50%',background:AC[i%AC.length],color:AT[i%AT.length],display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:500}}>
                  {b.name.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div style={table.name}>{b.name}</div>
                <div style={{fontSize:11,color:c.text2}}>{b.type}</div>
                <div><span style={pill(STATUS_COLOR[b.status]||'gray')}>{b.status}</span></div>
                <div style={{fontSize:12,display:'flex',gap:6}}>
                  <span style={{color:b.nda?c.green:c.text3}}>{b.nda?'NDA ✓':'NDA —'}</span>
                  <span style={{color:b.mgmt_meeting?c.green:c.text3}}>{b.mgmt_meeting?'Mgmt ✓':'Mgmt —'}</span>
                </div>
                <button onClick={e=>{e.stopPropagation(); if(confirm(`Remove ${b.name}?`)) deleteBuyer(b.id)}}
                  style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:14}}>×</button>
              </div>
            ))}
          </>
        )}
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setModal(null)}>
          <div style={{background:'#141414',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:28,width:400,display:'flex',flexDirection:'column',gap:14}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:500,color:c.text1}}>{modal==='add'?'Add buyer':'Edit buyer'}</div>
            <div>
              <div style={{fontSize:11,color:'#555',marginBottom:5}}>Buyer name</div>
              <input autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. KKR"
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>Type</div>
                <select value={form.type} onChange={e=>set('type',e.target.value)}
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
                  {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:11,color:'#555',marginBottom:5}}>Status</div>
                <select value={form.status} onChange={e=>set('status',e.target.value)}
                  style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
                  {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{display:'flex',gap:16}}>
              {[{key:'nda',label:'NDA signed'},{key:'mgmt_meeting',label:'Mgmt meeting held'}].map(({key,label})=>(
                <label key={key} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,color:c.text2}}>
                  <input type="checkbox" checked={form[key]} onChange={e=>set(key,e.target.checked)} style={{accentColor:c.green}}/>
                  {label}
                </label>
              ))}
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
