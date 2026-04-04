import { useState } from 'react'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { pill, panel, c } from '../../components/sell-side/ssStyles'

const STAGES = ['Prep phase', 'NDA / CIM', 'Mgmt meetings', 'First round bids', 'Final round', 'Exclusivity', 'Sign & close']

function stageStatus(mandateStage, step) {
  const mi = STAGES.indexOf(mandateStage)
  const si = STAGES.indexOf(step)
  if (si < mi) return 'done'
  if (si === mi) return 'active'
  return 'pending'
}

export default function SSProcesses() {
  const { activeMandate, updateMandate, loading } = useMandateContext()
  const [newContact, setNewContact] = useState({ role: '', name: '' })
  const [newTask, setNewTask] = useState('')
  const [addingContact, setAddingContact] = useState(false)
  const [addingTask, setAddingTask] = useState(false)

  if (loading) return <div style={{color:c.text3,fontSize:13}}>Loading...</div>
  if (!activeMandate) return <div style={{color:c.text3,fontSize:13}}>Select or create a mandate to get started.</div>

  const contacts = activeMandate.contacts || []
  const checklist = activeMandate.checklist || []

  const toggleTask = async (idx) => {
    const updated = checklist.map((t, i) => i === idx ? { ...t, done: !t.done } : t)
    await updateMandate(activeMandate.id, { checklist: updated })
  }

  const addTask = async () => {
    if (!newTask.trim()) return
    const updated = [...checklist, { label: newTask.trim(), done: false, owner: '' }]
    await updateMandate(activeMandate.id, { checklist: updated })
    setNewTask('')
    setAddingTask(false)
  }

  const removeTask = async (idx) => {
    await updateMandate(activeMandate.id, { checklist: checklist.filter((_, i) => i !== idx) })
  }

  const addContact = async () => {
    if (!newContact.name.trim()) return
    const updated = [...contacts, { ...newContact }]
    await updateMandate(activeMandate.id, { contacts: updated })
    setNewContact({ role: '', name: '' })
    setAddingContact(false)
  }

  const removeContact = async (idx) => {
    await updateMandate(activeMandate.id, { contacts: contacts.filter((_, i) => i !== idx) })
  }

  const setStage = async (stage) => {
    await updateMandate(activeMandate.id, { stage })
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      {/* Timeline */}
      <div style={panel.wrap}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:14,fontWeight:500,color:c.text1}}>{activeMandate.name}</span>
            <span style={pill(activeMandate.stage === 'Exclusivity' || activeMandate.stage === 'Sign & close' ? 'green' : activeMandate.stage === 'First round bids' || activeMandate.stage === 'Final round' ? 'amber' : 'blue')}>{activeMandate.stage}</span>
          </div>
          {activeMandate.lead_advisor && <span style={{fontSize:12,color:c.text3}}>Lead: {activeMandate.lead_advisor}</span>}
        </div>
        <div style={{display:'grid',gridTemplateColumns:`repeat(${STAGES.length},minmax(0,1fr))`,position:'relative'}}>
          {STAGES.map((step, i) => {
            const s = stageStatus(activeMandate.stage, step)
            const dot = {
              done: { background:'#3B6D11', color:'#fff' },
              active: { background:'#854F0B', color:'#fff' },
              pending: { background:'#202020', border:'1.5px solid rgba(255,255,255,0.11)', color:c.text3 },
            }[s]
            return (
              <div key={step} style={{display:'flex',flexDirection:'column',alignItems:'center',position:'relative',cursor:'pointer'}}
                onClick={() => setStage(step)}>
                {i < STAGES.length - 1 && <div style={{position:'absolute',top:10,left:'50%',width:'100%',height:1,background:'rgba(255,255,255,0.11)',zIndex:0}}/>}
                <div style={{width:20,height:20,borderRadius:'50%',zIndex:1,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:500,...dot}}>
                  {s === 'done' ? '✓' : s === 'active' ? '●' : i + 1}
                </div>
                <div style={{fontSize:10,color:s==='active'?c.amber:c.text2,marginTop:6,textAlign:'center',lineHeight:1.4}}>{step}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:14}}>
        {/* Checklist */}
        <div style={panel.wrap}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={panel.title}>Process checklist</div>
            <button onClick={() => setAddingTask(true)} style={{fontSize:11,color:c.green,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>+ Add</button>
          </div>
          {checklist.length === 0 && !addingTask && (
            <div style={{fontSize:12,color:c.text3}}>No tasks yet.</div>
          )}
          {checklist.map((item, i) => (
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'7px 0',borderBottom:i<checklist.length-1?'0.5px solid rgba(255,255,255,0.07)':'none'}}>
              <div onClick={() => toggleTask(i)} style={{width:15,height:15,borderRadius:4,flexShrink:0,marginTop:1,display:'flex',alignItems:'center',justifyContent:'center',background:item.done?'#3B6D11':'transparent',border:item.done?'none':'0.5px solid rgba(255,255,255,0.11)',cursor:'pointer'}}>
                {item.done && <span style={{color:'#fff',fontSize:9}}>✓</span>}
              </div>
              <div style={{fontSize:12,color:item.done?c.text3:c.text1,flex:1,textDecoration:item.done?'line-through':'none'}}>{item.label}</div>
              {item.owner && <div style={{fontSize:10,color:c.text3}}>{item.owner}</div>}
              <button onClick={() => removeTask(i)} style={{background:'none',border:'none',color:'#333',cursor:'pointer',fontSize:12,padding:0,lineHeight:1}}>×</button>
            </div>
          ))}
          {addingTask && (
            <div style={{display:'flex',gap:6,marginTop:8}}>
              <input autoFocus value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Task description"
                style={{flex:1,background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:5,color:'#f0f0f0',fontSize:12,padding:'5px 8px',fontFamily:'inherit'}}/>
              <button onClick={addTask} style={{fontSize:11,padding:'5px 10px',borderRadius:5,border:'none',background:c.green,color:'#0f0f0f',cursor:'pointer',fontWeight:600}}>Add</button>
              <button onClick={()=>setAddingTask(false)} style={{fontSize:11,padding:'5px 8px',borderRadius:5,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:c.text3,cursor:'pointer'}}>✕</button>
            </div>
          )}
        </div>

        {/* Key contacts */}
        <div style={panel.wrap}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={panel.title}>Key contacts</div>
            <button onClick={() => setAddingContact(true)} style={{fontSize:11,color:c.green,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>+ Add</button>
          </div>
          {contacts.length === 0 && !addingContact && (
            <div style={{fontSize:12,color:c.text3}}>No contacts yet.</div>
          )}
          {contacts.map((item, i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:i<contacts.length-1?'0.5px solid rgba(255,255,255,0.07)':'none'}}>
              <span style={{fontSize:11,color:c.text3}}>{item.role}</span>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontSize:13,fontWeight:500,color:c.text1}}>{item.name}</span>
                <button onClick={() => removeContact(i)} style={{background:'none',border:'none',color:'#333',cursor:'pointer',fontSize:12,padding:0}}>×</button>
              </div>
            </div>
          ))}
          {addingContact && (
            <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
              <input autoFocus value={newContact.role} onChange={e=>setNewContact(c=>({...c,role:e.target.value}))} placeholder="Role (e.g. Lead advisor)"
                style={{background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:5,color:'#f0f0f0',fontSize:12,padding:'5px 8px',fontFamily:'inherit'}}/>
              <input value={newContact.name} onChange={e=>setNewContact(c=>({...c,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&addContact()} placeholder="Name"
                style={{background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.11)',borderRadius:5,color:'#f0f0f0',fontSize:12,padding:'5px 8px',fontFamily:'inherit'}}/>
              <div style={{display:'flex',gap:6}}>
                <button onClick={addContact} style={{fontSize:11,padding:'5px 10px',borderRadius:5,border:'none',background:c.green,color:'#0f0f0f',cursor:'pointer',fontWeight:600}}>Add</button>
                <button onClick={()=>setAddingContact(false)} style={{fontSize:11,padding:'5px 8px',borderRadius:5,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:c.text3,cursor:'pointer'}}>✕</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
