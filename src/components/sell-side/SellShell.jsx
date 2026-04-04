import { useNavigate, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

const NAV = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', path: '/sell/dashboard' }] },
  { group: 'Processes', items: [
    { id: 'processes', label: 'Active Processes', path: '/sell/processes', badge: '4' },
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

  return (
    <div style={{display:'grid',gridTemplateColumns:'224px 1fr',height:'100vh',overflow:'hidden',background:'#0f0f0f',fontFamily:'inherit'}}>
      <aside style={{background:'#141414',borderRight:'0.5px solid rgba(255,255,255,0.07)',display:'flex',flexDirection:'column',height:'100vh'}}>
        <div style={{padding:'1.25rem 1rem 1rem',borderBottom:'0.5px solid rgba(255,255,255,0.07)'}}>
          <div style={{fontSize:10,fontWeight:500,letterSpacing:'0.2em',color:'#555',marginBottom:14}}>DEALFLOW</div>
          <div style={{background:'#1a1a1a',border:'0.5px solid rgba(255,255,255,0.07)',borderRadius:8,padding:3,display:'flex',gap:2}}>
            <button onClick={() => navigate('/raise')} style={{flex:1,fontSize:11,fontWeight:500,padding:'5px 4px',border:'none',borderRadius:6,background:'transparent',color:'#555',cursor:'pointer',fontFamily:'inherit'}}>Capital Raise</button>
            <button style={{flex:1,fontSize:11,fontWeight:500,padding:'5px 4px',border:'0.5px solid rgba(59,109,17,0.3)',borderRadius:6,background:'#0d2014',color:'#7bc75e',cursor:'pointer',fontFamily:'inherit'}}>Sell Side</button>
          </div>
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
                  {item.badge && <span style={{marginLeft:'auto',fontSize:10,padding:'1px 6px',borderRadius:99,background:'#2a2a2a',color:'#555'}}>{item.badge}</span>}
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
            <span style={{fontSize:10,fontWeight:500,padding:'3px 9px',borderRadius:99,background:'#0d2014',color:'#7bc75e',border:'0.5px solid rgba(59,109,17,0.3)'}}>Sell Side</span>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{fontSize:12,padding:'6px 14px',borderRadius:8,border:'0.5px solid rgba(255,255,255,0.11)',background:'transparent',color:'#888',cursor:'pointer',fontFamily:'inherit'}}>Filter</button>
            <button style={{fontSize:12,padding:'6px 14px',borderRadius:8,border:'none',background:'#f0f0f0',color:'#0f0f0f',cursor:'pointer',fontWeight:500,fontFamily:'inherit'}}>+ New Process</button>
          </div>
        </header>
        <main style={{overflowY:'auto',padding:'1.5rem',background:'#0f0f0f'}}>{children}</main>
      </div>
    </div>
  )
}
