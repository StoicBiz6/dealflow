import { useState } from 'react'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { useBuyers } from '../../hooks/useSellSide'
import { panel, table, c } from '../../components/sell-side/ssStyles'

const FOLDERS = ['Financials', 'Commercial', 'Technology', 'Management', 'Legal', 'Diligence', 'Other']
const BLANK = { name: '', folder: 'Financials' }

export default function SSDataRoom() {
  const { activeMandate, updateMandate, loading } = useMandateContext()
  const { buyers } = useBuyers(activeMandate?.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  if (loading) return <div style={{color:c.text3,fontSize:13}}>Loading...</div>
  if (!activeMandate) return <div style={{color:c.text3,fontSize:13}}>Select or create a mandate first.</div>

  const docs = activeMandate.checklist?.filter ? [] : []
  // Store docs in mandate.notes as JSON for simplicity — use a separate field
  let dataroom = []
  try { dataroom = JSON.parse(activeMandate.notes || '{}')?.dataroom || [] } catch {}

  const saveDataroom = async (updated) => {
    let existing = {}
    try { existing = JSON.parse(activeMandate.notes || '{}') } catch {}
    await updateMandate(activeMandate.id, { notes: JSON.stringify({ ...existing, dataroom: updated }) })
  }

  const addDoc = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const updated = [...dataroom, { ...form, added: new Date().toISOString() }]
    await saveDataroom(updated)
    setForm(BLANK)
    setModal(false)
    setSaving(false)
  }

  const removeDoc = async (i) => {
    await saveDataroom(dataroom.filter((_, idx) => idx !== i))
  }

  const byFolder = {}
  dataroom.forEach(d => { if (!byFolder[d.folder]) byFolder[d.folder] = []; byFolder[d.folder].push(d) })

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.6fr) minmax(0,1fr)',gap:14}}>
        <div style={panel.wrap}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <div style={panel.title}>Documents — {activeMandate.name}</div>
            <button onClick={()=>setModal(true)} style={{fontSize:12,padding:'5px 12px',borderRadius:6,border:'none',background:'#f0f0f0',color:'#0f0f0f',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>+ Add document</button>
          </div>
          {dataroom.length === 0 ? (
            <div style={{color:c.text3,fontSize:13}}>No documents tracked yet.</div>
          ) : (
            <>
              <div style={{...table.row,gridTemplateColumns:'1fr 90px 130px 28px',paddingBottom:8,borderBottom:'0.5px solid rgba(255,255,255,0.11)'}}>
                {['Document','Folder','Added',''].map(h=><span key={h} style={table.header}>{h}</span>)}
              </div>
              {dataroom.map((d, i) => (
                <div key={i} style={{...table.row,gridTemplateColumns:'1fr 90px 130px 28px',borderBottom:i<dataroom.length-1?'0.5px solid rgba(255,255,255,0.07)':'none'}}>
                  <div style={{fontSize:12,fontWeight:500,color:c.text1}}>{d.name}</div>
                  <div style={{fontSize:11,color:c.text3}}>{d.folder}</div>
                  <div style={{fontSize:11,color:c.text3}}>{d.added ? new Date(d.added).toLocaleDateString() : '—'}</div>
                  <button onClick={()=>removeDoc(i)} style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:14}}>×</button>
                </div>
              ))}
            </>
          )}
        </div>

        <div style={panel.wrap}>
          <div style={panel.title}>Buyer engagement</div>
          <div style={{marginTop:12}}>
            {buyers.length === 0 ? (
              <div style={{color:c.text3,fontSize:12}}>Add buyers in the Buyer Universe tab to track engagement.</div>
            ) : (
              buyers.map((b, i) => {
                const docsViewed = Math.floor(Math.random() * dataroom.length) // placeholder
                const pct = dataroom.length ? Math.round((docsViewed / dataroom.length) * 100) : 0
                return (
                  <div key={b.id} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:12,fontWeight:500,color:c.text1}}>{b.name}</span>
                      <span style={{fontSize:11,color:c.text3}}>{b.status}</span>
                    </div>
                    <div style={{height:4,background:'#202020',borderRadius:99,overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${b.nda ? (b.mgmt_meeting ? 80 : 50) : 20}%`,background:c.blue,opacity:0.7,borderRadius:99}}/>
                    </div>
                    <div style={{fontSize:10,color:c.text3,marginTop:3}}>
                      {b.nda ? 'NDA signed' : 'No NDA'}{b.mgmt_meeting ? ' · Mgmt meeting held' : ''}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setModal(false)}>
          <div style={{background:'#141414',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:28,width:400,display:'flex',flexDirection:'column',gap:14}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:14,fontWeight:500,color:c.text1}}>Add document</div>
            <div>
              <div style={{fontSize:11,color:'#555',marginBottom:5}}>Document name</div>
              <input autoFocus value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Financial model"
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit',boxSizing:'border-box'}}/>
            </div>
            <div>
              <div style={{fontSize:11,color:'#555',marginBottom:5}}>Folder</div>
              <select value={form.folder} onChange={e=>setForm(f=>({...f,folder:e.target.value}))}
                style={{width:'100%',background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:6,color:'#f0f0f0',fontSize:13,padding:'8px 10px',fontFamily:'inherit'}}>
                {FOLDERS.map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:4}}>
              <button onClick={()=>setModal(false)} style={{padding:'7px 16px',borderRadius:6,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:'#888',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>Cancel</button>
              <button onClick={addDoc} disabled={saving} style={{padding:'7px 16px',borderRadius:6,border:'none',background:'#7bc75e',color:'#0f0f0f',cursor:'pointer',fontSize:13,fontWeight:600,fontFamily:'inherit'}}>
                {saving?'Saving...':'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
