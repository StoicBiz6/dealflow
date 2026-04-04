import { UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ view, setView, onAdd, onImport, workspaceName: workspace, onWorkspace, pendingTaskCount: taskCount }) {
  const navigate = useNavigate()
  return (
    <nav style={{
      height: '52px',
      background: '#0a0a0a',
      borderBottom: '1px solid #1f1f1f',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Platform switcher */}
      <div style={{ background: '#141414', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: 3, display: 'flex', gap: 2, flexShrink: 0 }}>
        <button style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', border: '0.5px solid rgba(124,106,247,0.3)', borderRadius: 6, background: '#0d1f35', color: '#7c9fff', cursor: 'pointer', fontFamily: 'inherit' }}>Capital Raise</button>
        <button onClick={() => navigate('/sell/dashboard')} style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', border: 'none', borderRadius: 6, background: 'transparent', color: '#555', cursor: 'pointer', fontFamily: 'inherit' }}>Sell Side</button>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'pipeline', label: 'Pipeline' },
          { id: 'list', label: 'List' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'tasks', label: 'Tasks', badge: taskCount || null },
          { id: 'news', label: 'News' },
        ].map(({ id, label, badge }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            style={{
              background: view === id ? '#1a1a1a' : 'transparent',
              border: 'none',
              borderRadius: '5px',
              color: view === id ? '#f0f0f0' : '#555',
              cursor: 'pointer',
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              padding: '5px 12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: '5px',
            }}
          >
            {label}
            {badge != null && badge > 0 && (
              <span style={{
                background: 'rgba(124,106,247,0.18)', color: '#9d8fff',
                borderRadius: '10px', fontSize: '10px', padding: '0px 6px',
                fontFamily: 'DM Mono, monospace', letterSpacing: 0,
              }}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* Workspace button */}
        <button
          onClick={onWorkspace}
          title={workspace ? `Workspace: ${workspace.name}` : 'Set up team workspace'}
          style={{
            background: workspace ? 'rgba(124,106,247,0.12)' : 'transparent',
            border: `1px solid ${workspace ? '#7c6af7' : '#2a2a2a'}`,
            borderRadius: '6px',
            color: workspace ? '#c4b5fd' : '#555',
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            padding: '5px 13px',
            letterSpacing: '0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>👥</span>
          <span>{workspace ? workspace.name : 'Team'}</span>
        </button>

        <button
          onClick={onImport}
          style={{
            background: 'transparent',
            border: '1px solid #2a2a2a',
            borderRadius: '6px',
            color: '#888',
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            padding: '5px 13px',
            letterSpacing: '0.03em',
          }}
        >
          ↑ Import
        </button>
        <button
          onClick={onAdd}
          style={{
            background: '#7c6af7',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: 'DM Mono, monospace',
            fontSize: '12px',
            padding: '6px 14px',
            letterSpacing: '0.03em',
          }}
        >
          + Add Deal
        </button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </nav>
  )
}
