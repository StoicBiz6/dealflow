import { useState } from 'react'
import { useMandateContext } from '../../components/sell-side/SellShell'
import { c } from '../../components/sell-side/ssStyles'

const STAGES = ['Prep phase', 'NDA / CIM', 'Mgmt meetings', 'First round bids', 'Final round', 'Exclusivity', 'Sign & close']

const STAGE_COLORS = {
  'Prep phase':       { text: '#888',    border: 'rgba(255,255,255,0.08)' },
  'NDA / CIM':        { text: '#7ea6e0', border: 'rgba(126,166,224,0.2)' },
  'Mgmt meetings':    { text: '#b08af0', border: 'rgba(176,138,240,0.2)' },
  'First round bids': { text: '#f0c070', border: 'rgba(240,192,112,0.2)' },
  'Final round':      { text: '#f0a050', border: 'rgba(240,160,80,0.2)'  },
  'Exclusivity':      { text: '#7bc75e', border: 'rgba(123,199,94,0.2)'  },
  'Sign & close':     { text: '#7bc75e', border: 'rgba(123,199,94,0.3)'  },
}

const fmt = (n) => {
  if (!n) return null
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}B`
  return `$${n}M`
}

export default function SSProcesses() {
  const { mandates, updateMandate, setActiveMandateId, loading } = useMandateContext()
  const [draggedId, setDraggedId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  if (loading) return <div style={{ color: c.text3, fontSize: 13 }}>Loading...</div>

  const byStage = {}
  STAGES.forEach(s => { byStage[s] = [] })
  mandates.forEach(m => {
    if (byStage[m.stage]) byStage[m.stage].push(m)
    else byStage['Prep phase'].push(m)
  })

  const handleDrop = (e, stage) => {
    e.preventDefault()
    if (draggedId) updateMandate(draggedId, { stage })
    setDraggedId(null)
    setOverStage(null)
  }

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', minHeight: 'calc(100vh - 120px)', alignItems: 'flex-start', paddingBottom: 24 }}>
      {STAGES.map(stage => {
        const cards = byStage[stage]
        const colors = STAGE_COLORS[stage]
        const isOver = overStage === stage

        return (
          <div
            key={stage}
            onDragOver={e => { e.preventDefault(); setOverStage(stage) }}
            onDragLeave={() => setOverStage(null)}
            onDrop={e => handleDrop(e, stage)}
            style={{ minWidth: 200, width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {/* Column header */}
            <div style={{
              background: isOver ? '#1a1a1a' : '#111',
              border: `0.5px solid ${isOver ? colors.border : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 8,
              padding: '9px 11px',
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: colors.text, fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {stage}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, color: '#666', fontSize: 10, padding: '1px 6px' }}>
                  {cards.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 40 }}>
              {cards.map(m => (
                <MandateCard
                  key={m.id}
                  mandate={m}
                  onDragStart={() => setDraggedId(m.id)}
                  onDragEnd={() => { setDraggedId(null); setOverStage(null) }}
                  onClick={() => setActiveMandateId(m.id)}
                  onStage={stage => updateMandate(m.id, { stage })}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MandateCard({ mandate, onDragStart, onDragEnd, onClick, onStage }) {
  const [menu, setMenu] = useState(false)
  const evMid = mandate.ev_low && mandate.ev_high
    ? Math.round((mandate.ev_low + mandate.ev_high) / 2)
    : mandate.ev_low || null

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => { setMenu(false); onClick() }}
      style={{
        background: '#111',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '10px 11px',
        cursor: 'grab',
        position: 'relative',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0', marginBottom: 5 }}>{mandate.name}</div>

      {mandate.sector && (
        <div style={{ fontSize: 10, color: c.text3, marginBottom: 4 }}>{mandate.sector}</div>
      )}

      {evMid && (
        <div style={{ fontSize: 12, color: c.green, fontFamily: 'DM Mono, monospace', marginBottom: 4 }}>{fmt(evMid)}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {mandate.lead_advisor
          ? <span style={{ fontSize: 10, color: c.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{mandate.lead_advisor}</span>
          : <span />
        }
        <button
          onClick={e => { e.stopPropagation(); setMenu(m => !m) }}
          style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 15, padding: '0 2px', lineHeight: 1, marginLeft: 'auto' }}
        >
          ···
        </button>
      </div>

      {menu && (
        <div
          style={{ position: 'absolute', right: 8, top: 36, zIndex: 20, background: '#1a1a1a', border: '0.5px solid rgba(255,255,255,0.11)', borderRadius: 6, overflow: 'hidden', minWidth: 140 }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ fontSize: 9, color: c.text3, padding: '6px 10px 3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Move to</div>
          {STAGES.map(s => s !== mandate.stage && (
            <button key={s} onClick={() => { setMenu(false); onStage(s) }}
              style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 11, padding: '6px 10px', textAlign: 'left', fontFamily: 'inherit' }}
              onMouseEnter={e => e.currentTarget.style.background = '#222'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
