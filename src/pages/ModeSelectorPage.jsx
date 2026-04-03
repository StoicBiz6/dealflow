import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

export default function ModeSelectorPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)
  const firstName = user?.firstName || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  function proceed() {
    if (!selected) return
    navigate(selected === 'raise' ? '/' : '/sell/dashboard')
  }
  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem 1.5rem',background:'#0f0f0f'}}>
      <div style={{fontSize:11,fontWeight:500,letterSpacing:'0.22em',color:'#555',marginBottom:'2.5rem'}}>DEALFLOW</div>
      <div style={{fontSize:22,fontWeight:500,color:'#f0f0f0',marginBottom:6}}>{greeting}, {firstName}.</div>
      <div style={{fontSize:14,color:'#888',marginBottom:'2.5rem'}}>Which platform would you like to open?</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:12,width:'100%',maxWidth:560,marginBottom:'2rem'}}>
        <button onClick={() => setSelected('raise')} style={{position:'relative',background:selected==='raise'?'#0d1f35':'#1a1a1a',border:selected==='raise'?'1.5px solid #185FA5':'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:'1.75rem 1.5rem',cursor:'pointer',display:'flex',flexDirection:'column',gap:12,textAlign:'left'}}>
          <div style={{fontSize:15,fontWeight:500,color:'#f0f0f0'}}>Capital Raise</div>
          <div style={{fontSize:12,color:'#888',lineHeight:1.6}}>Track LP relationships, manage your investor pipeline, and monitor fund close progress.</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {['LP pipeline','Soft circles','Commitments'].map(t=><span key={t} style={{fontSize:10,padding:'2px 8px',borderRadius:99,border:'0.5px solid rgba(255,255,255,0.11)',color:'#555'}}>{t}</span>)}
          </div>
        </button>
        <button onClick={() => setSelected('sell')} style={{position:'relative',background:selected==='sell'?'#0d2014':'#1a1a1a',border:selected==='sell'?'1.5px solid #3B6D11':'0.5px solid rgba(255,255,255,0.11)',borderRadius:12,padding:'1.75rem 1.5rem',cursor:'pointer',display:'flex',flexDirection:'column',gap:12,textAlign:'left'}}>
          <div style={{fontSize:15,fontWeight:500,color:'#f0f0f0'}}>Sell Side</div>
          <div style={{fontSize:12,color:'#888',lineHeight:1.6}}>Run structured M&A sale processes, manage buyer universes, and track bids to close.</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {['Buyer universe','Bid tracking','Data room'].map(t=><span key={t} style={{fontSize:10,padding:'2px 8px',borderRadius:99,border:'0.5px solid rgba(255,255,255,0.11)',color:'#555'}}>{t}</span>)}
          </div>
        </button>
      </div>
      <button onClick={proceed} disabled={!selected} style={{width:'100%',maxWidth:560,padding:13,borderRadius:8,border:'none',background:selected?'#f0f0f0':'#2a2a2a',color:selected?'#0f0f0f':'#555',fontSize:14,fontWeight:500,cursor:selected?'pointer':'not-allowed'}}>
        {selected==='raise'?'Open Capital Raise':selected==='sell'?'Open Sell Side':'Select a platform'}
      </button>
    </div>
  )
}
