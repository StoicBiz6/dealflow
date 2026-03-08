import { UserButton } from '@clerk/clerk-react'

export default function Navbar({ view, setView, onAddDeal }) {
  return (
    <nav style={{
      height: '52px',
      background: '#0a0a0a',
      borderBottom: '1px solid #1f1f1f',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Logo */}
      <span style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '16px',
        letterSpacing: '0.08em',
        color: '#f0f0f0',
        marginRight: '8px',
      }}>
        DEALFLOW
      </span>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {['pipeline', 'dashboard', 'list'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              background: view === v ? '#1a1a1a' : 'transparent',
              border: 'none',
              borderRadius: '5px',
              color: view === v ? '#f0f0f0' : '#555',
              cursor: 'pointer',
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              padding: '5px 12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
          >
            {v === 'pipeline' ? 'Pipeline' : v === 'dashboard' ? 'Dashboard' : 'List'}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onAddDeal}
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
