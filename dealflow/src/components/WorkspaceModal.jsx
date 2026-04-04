import { useState } from 'react'

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modal = { background: '#111', border: '1px solid #222', borderRadius: 14, width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '85vh' }
const hdr = { padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }
const body = { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }
const ftr = { padding: '16px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }
const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, color: '#e5e5e5', fontSize: 13, padding: '9px 12px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btn = (v) => ({ background: v === 'primary' ? '#7c6af7' : v === 'ghost' ? 'transparent' : '#1a1a1a', border: v === 'primary' ? 'none' : v === 'ghost' ? 'none' : '1px solid #2a2a2a', color: v === 'primary' ? '#fff' : v === 'ghost' ? '#555' : '#aaa', borderRadius: 7, padding: '9px 20px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: v === 'primary' ? 600 : 400 })
const codeBox = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 16px', fontFamily: 'DM Mono, monospace', fontSize: 22, letterSpacing: '0.15em', color: '#c4b5fd', textAlign: 'center', userSelect: 'all' }
const memberRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1a1a1a' }

function WorkspaceRow({ label, sub, icon, active, onSelect, onSettings }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: active ? 'rgba(124,106,247,0.1)' : hover ? '#181818' : '#161616',
        border: `1px solid ${active ? '#7c6af7' : '#222'}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 0.12s',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onSelect}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: active ? '#c4b5fd' : '#e0e0e0', fontSize: 13, fontWeight: 500 }}>{label}</div>
        <div style={{ color: '#555', fontSize: 11, marginTop: 1 }}>{sub}</div>
      </div>
      {active && <span style={{ color: '#7c6af7', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>active</span>}
      {onSettings && (
        <button
          onClick={e => { e.stopPropagation(); onSettings() }}
          title="Manage workspace"
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '2px 4px', borderRadius: 4, lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = '#888'}
          onMouseLeave={e => e.currentTarget.style.color = '#444'}
        >
          ⚙
        </button>
      )}
    </div>
  )
}

export default function WorkspaceModal({ workspaces, activeWorkspace, onClose, onSwitch, onLoadMembers, onCreate, onJoin, onLeave, currentUserId }) {
  const [mode, setMode] = useState('list') // list | create | join | settings
  const [settingsWs, setSettingsWs] = useState(null)
  const [members, setMembers] = useState([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const openSettings = async (ws) => {
    setSettingsWs(ws)
    setMode('settings')
    const mems = await onLoadMembers(ws.id)
    setMembers(mems)
  }

  const handleCreate = async () => {
    if (!name.trim()) return
    setLoading(true); setError('')
    try {
      await onCreate(name.trim())
      onClose()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (code.length < 6) return
    setLoading(true); setError('')
    try {
      await onJoin(code.trim())
      onClose()
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleLeave = async () => {
    if (!confirm(`Leave "${settingsWs.name}"? You'll lose access to all shared deals.`)) return
    setLoading(true)
    try { await onLeave(settingsWs.id); onClose() }
    catch (e) { setError(e.message) }
    setLoading(false)
  }

  const handleSwitch = (id) => { onSwitch(id); onClose() }

  const copyCode = () => {
    navigator.clipboard.writeText(settingsWs?.invite_code || '')
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const title = mode === 'list' ? 'Workspaces'
    : mode === 'create' ? 'Create Workspace'
    : mode === 'join' ? 'Join Workspace'
    : settingsWs?.name || 'Settings'

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modal}>

        {/* Header */}
        <div style={hdr}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {mode !== 'list' && (
                <button
                  onClick={() => setMode('list')}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, padding: '0 4px 0 0' }}
                >
                  ←
                </button>
              )}
              <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>
                {title}
              </span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
          {mode === 'settings' && settingsWs && (
            <div style={{ color: '#555', fontSize: 11, marginTop: 4, fontFamily: 'DM Mono, monospace' }}>
              {members.length} member{members.length !== 1 ? 's' : ''} · {settingsWs.role === 'owner' ? 'Owner' : 'Member'}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={body}>

          {/* LIST MODE */}
          {mode === 'list' && (
            <>
              <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'DM Mono, monospace' }}>Select Active</div>

              <WorkspaceRow
                label="Personal"
                sub="Private deals visible only to you"
                icon="👤"
                active={!activeWorkspace}
                onSelect={() => handleSwitch(null)}
                onSettings={null}
              />

              {workspaces.length > 0 && (
                <>
                  <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
                    Team Workspaces
                  </div>
                  {workspaces.map(ws => (
                    <WorkspaceRow
                      key={ws.id}
                      label={ws.name}
                      sub={ws.role === 'owner' ? 'Owner' : 'Member'}
                      icon="👥"
                      active={activeWorkspace?.id === ws.id}
                      onSelect={() => handleSwitch(ws.id)}
                      onSettings={() => openSettings(ws)}
                    />
                  ))}
                </>
              )}

              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 14, display: 'flex', gap: 8 }}>
                <button style={{ ...btn(), flex: 1 }} onClick={() => { setName(''); setError(''); setMode('create') }}>
                  ✦ New workspace
                </button>
                <button style={{ ...btn(), flex: 1 }} onClick={() => { setCode(''); setError(''); setMode('join') }}>
                  → Join workspace
                </button>
              </div>
            </>
          )}

          {/* CREATE MODE */}
          {mode === 'create' && (
            <>
              <div style={{ color: '#666', fontSize: 12 }}>Give your workspace a name — usually your firm or team name.</div>
              <input
                style={inp}
                placeholder="e.g. Acme Capital, Deal Team..."
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
              {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
            </>
          )}

          {/* JOIN MODE */}
          {mode === 'join' && (
            <>
              <div style={{ color: '#666', fontSize: 12 }}>Enter the 6-character invite code from your team admin.</div>
              <input
                style={{ ...inp, fontFamily: 'DM Mono, monospace', fontSize: 18, letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center' }}
                placeholder="ABC123"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
                maxLength={6}
              />
              {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
            </>
          )}

          {/* SETTINGS MODE */}
          {mode === 'settings' && settingsWs && (
            <>
              <div>
                <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>Invite Code</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={codeBox}>{settingsWs.invite_code}</div>
                  <button onClick={copyCode} style={{ ...btn(), padding: '9px 14px', flexShrink: 0 }}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{ color: '#444', fontSize: 11, marginTop: 6 }}>Share this code with teammates so they can join your workspace</div>
              </div>

              <div>
                <div style={{ color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8, fontFamily: 'DM Mono, monospace' }}>Members ({members.length})</div>
                <div style={{ background: '#1a1a1a', borderRadius: 8, padding: '0 12px' }}>
                  {members.map((m, i) => {
                    const isYou = m.user_id === currentUserId
                    const isOwner = m.user_id === settingsWs.owner_id
                    const name = m.profile?.full_name || (isYou ? 'You' : 'Member')
                    const email = m.profile?.email || ''
                    const avatar = m.profile?.avatar_url
                    const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <div key={i} style={memberRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {avatar ? (
                            <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#888', fontWeight: 600, flexShrink: 0 }}>
                              {initials || '?'}
                            </div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ color: '#e0e0e0', fontSize: 13 }}>{name}</span>
                              {isYou && <span style={{ color: '#7c6af7', fontSize: 10, fontFamily: 'DM Mono, monospace' }}>you</span>}
                            </div>
                            {email && <div style={{ color: '#555', fontSize: 11, marginTop: 1 }}>{email}</div>}
                          </div>
                        </div>
                        <span style={{
                          color: isOwner ? '#c4b5fd' : '#555',
                          fontSize: 10,
                          fontFamily: 'DM Mono, monospace',
                          background: isOwner ? 'rgba(124,106,247,0.1)' : 'transparent',
                          border: `1px solid ${isOwner ? 'rgba(124,106,247,0.3)' : '#2a2a2a'}`,
                          padding: '2px 8px',
                          borderRadius: 4,
                        }}>
                          {m.role}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}
            </>
          )}

        </div>

        {/* Footer */}
        <div style={ftr}>
          {mode === 'list' && <button style={btn('ghost')} onClick={onClose}>Close</button>}

          {mode === 'create' && (
            <>
              <button style={btn()} onClick={() => setMode('list')}>Back</button>
              <button style={btn('primary')} onClick={handleCreate} disabled={loading || !name.trim()}>
                {loading ? 'Creating…' : 'Create Workspace'}
              </button>
            </>
          )}

          {mode === 'join' && (
            <>
              <button style={btn()} onClick={() => setMode('list')}>Back</button>
              <button style={btn('primary')} onClick={handleJoin} disabled={loading || code.length < 6}>
                {loading ? 'Joining…' : 'Join Workspace'}
              </button>
            </>
          )}

          {mode === 'settings' && (
            <>
              {settingsWs?.role !== 'owner' && (
                <button style={{ ...btn(), color: '#f87171', border: '1px solid #991b1b' }} onClick={handleLeave} disabled={loading}>
                  Leave Workspace
                </button>
              )}
              <button style={btn('primary')} onClick={() => setMode('list')}>Done</button>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
