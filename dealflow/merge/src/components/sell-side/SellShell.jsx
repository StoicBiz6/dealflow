import { useNavigate, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

const NAV = [
  { group: 'Overview', items: [{ id: 'dashboard', label: 'Dashboard', path: '/sell/dashboard' }] },
  { group: 'Processes', items: [
    { id: 'processes', label: 'Active Processes', path: '/sell/processes', badge: '4' },
    { id: 'buyers',    label: 'Buyer Universe',   path: '/sell/buyers' },
  ]},
  { group: 'Deal Room', items: [
    { id: 'bids',     label: 'Bids & Offers', path: '/sell/bids' },
    { id: 'dataroom', label: 'Data Room',      path: '/sell/dataroom' },
  ]},
]

const META = {
  dashboard: { title: 'Dashboard',        primary: '+ New Process', secondary: 'Filter' },
  processes:  { title: 'Active Processes', primary: '+ New Process', secondary: 'Filter' },
  buyers:     { title: 'Buyer Universe',   primary: '+ Add Buyer',   secondary: 'Export' },
  bids:       { title: 'Bids & Offers',    primary: 'Compare Bids',  secondary: 'Filter' },
  dataroom:   { title: 'Data Room',        primary: '+ Upload',      secondary: 'Manage Access' },
}

export default function SellShell({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useUser()

  const activeId = location.pathname.split('/').pop()
  const meta = META[activeId] || META['dashboard']

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.wordmark}>DEALFLOW</div>
          <div style={s.modeSwitcher}>
            <button style={s.modeBtnInactive} onClick={() => navigate('/')}>Capital Raise</button>
            <button style={s.modeBtnActive}>Sell Side</button>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(group => (
            <div key={group.group} style={s.navGroup}>
              <div style={s.groupLabel}>{group.group}</div>
              {group.items.map(item => {
                const isActive = activeId === item.id
                return (
                  <button
                    key={item.id}
                    style={{ ...s.navItem, ...(isActive ? s.navItemActive : {}) }}
                    onClick={() => navigate(item.path)}
                  >
                    <span style={s.navDot} />
                    {item.label}
                    {item.badge && <span style={s.badge}>{item.badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div style={s.sidebarBottom}>
          <div style={s.userRow}>
            <UserButton afterSignOutUrl="/select" />
            <div>
              <div style={s.userName}>{user?.firstName} {user?.lastName}</div>
              <div style={s.userEmail}>{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <div style={s.topbarLeft}>
            <span style={s.pageTitle}>{meta.title}</span>
            <span style={s.modePill}>Sell Side</span>
          </div>
          <div style={s.topbarRight}>
            <button style={s.tbBtn}>{meta.secondary}</button>
            <button style={s.tbBtnPrimary}>{meta.primary}</button>
          </div>
        </header>
        <main style={s.content}>{children}</main>
      </div>
    </div>
  )
}

const s = {
  app: { display: 'grid', gridTemplateColumns: '224px 1fr', height: '100vh', overflow: 'hidden', background: '#0f0f0f' },
  sidebar: { background: '#141414', borderRight: '0.5px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: '100vh' },
  sidebarTop: { padding: '1.25rem 1rem 1rem', borderBottom: '0.5px solid rgba(255,255,255,0.07)' },
  wordmark: { fontSize: 10, fontWeight: 500, letterSpacing: '0.2em', color: '#555', marginBottom: 14 },
  modeSwitcher: { background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3, display: 'flex', gap: 2 },
  modeBtnInactive: { flex: 1, fontSize: 11, fontWeight: 500, padding: '5px 4px', border: 'none', borderRadius: 6, background: 'transparent', color: '#555', cursor: 'pointer', fontFamily: 'inherit' },
  modeBtnActive: { flex: 1, fontSize: 11, fontWeight: 500, padding: '5px 4px', border: '0.5px solid rgba(59,109,17,0.3)', borderRadius: 6, background: '#0d2014', color: '#7bc75e', cursor: 'pointer', fontFamily: 'inherit' },
  nav: { flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem 1rem' },
  navGroup: { marginTop: '1.25rem' },
  groupLabel: { fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555', padding: '0 8px', marginBottom: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: '#888', fontSize: 13, textAlign: 'left', cursor: 'pointer', marginBottom: 1, fontFamily: 'inherit' },
  navItemActive: { background: '#0d2014', color: '#7bc75e', fontWeight: 500, border: '0.5px solid rgba(59,109,17,0.25)' },
  navDot: { width: 5, height: 5, borderRadius: '50%', background: '#7bc75e', opacity: 0.5, flexShrink: 0 },
  badge: { marginLeft: 'auto', fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#2a2a2a', color: '#555' },
  sidebarBottom: { padding: '0.75rem 1rem', borderTop: '0.5px solid rgba(255,255,255,0.07)' },
  userRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px', borderRadius: 8 },
  userName: { fontSize: 12, fontWeight: 500, color: '#f0f0f0' },
  userEmail: { fontSize: 10, color: '#555', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  main: { display: 'grid', gridTemplateRows: '52px 1fr', height: '100vh', overflow: 'hidden' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', background: '#0f0f0f', borderBottom: '0.5px solid rgba(255,255,255,0.07)' },
  topbarLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  pageTitle: { fontSize: 15, fontWeight: 500, color: '#f0f0f0' },
  modePill: { fontSize: 10, fontWeight: 500, padding: '3px 9px', borderRadius: 99, background: '#0d2014', color: '#7bc75e', border: '0.5px solid rgba(59,109,17,0.3)' },
  topbarRight: { display: 'flex', gap: 8 },
  tbBtn: { fontSize: 12, padding: '6px 14px', borderRadius: 8, border: '0.5px solid rgba(255,255,255,0.11)', background: 'transparent', color: '#888', cursor: 'pointer', fontFamily: 'inherit' },
  tbBtnPrimary: { fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: '#f0f0f0', color: '#0f0f0f', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' },
  content: { overflowY: 'auto', padding: '1.5rem', background: '#0f0f0f' },
}
