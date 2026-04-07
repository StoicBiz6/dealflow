import { useState } from 'react'
import { STAGE_COLORS, STAGES } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

const ROW_HEIGHT = 44
const LABEL_WIDTH = 220
const HEADER_HEIGHT = 48
const BAR_HEIGHT = 22
const BAR_RADIUS = 5

function getMonthsBetween(start, end) {
  const months = []
  const cur = new Date(start.getFullYear(), start.getMonth(), 1)
  const last = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cur <= last) {
    months.push(new Date(cur))
    cur.setMonth(cur.getMonth() + 1)
  }
  return months
}

function toDateObj(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d) ? null : d
}

export default function TimelineView({ deals, onOpenDeal }) {
  const [filterStage, setFilterStage] = useState('all')
  const [hiddenDeals, setHiddenDeals] = useState(new Set()) // deal IDs hidden by user
  const [showPicker, setShowPicker] = useState(false)

  const toggleDeal = (id) => {
    setHiddenDeals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = (visible) => {
    setHiddenDeals(visible ? new Set() : new Set(deals.map(d => d.id)))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Filter by stage then by hidden set
  const filtered = deals.filter(d =>
    (filterStage === 'all' || d.stage === filterStage) && !hiddenDeals.has(d.id)
  )

  // Sort: deals with close date first (by close date asc), then no-date by created_at
  const sorted = [...filtered].sort((a, b) => {
    const ca = toDateObj(a.expected_close_date)
    const cb = toDateObj(b.expected_close_date)
    if (ca && cb) return ca - cb
    if (ca) return -1
    if (cb) return 1
    return new Date(a.created_at) - new Date(b.created_at)
  })

  // Time range
  const allStarts = sorted.map(d => toDateObj(d.created_at) || today)
  const allEnds = sorted.map(d => toDateObj(d.expected_close_date)).filter(Boolean)

  const rangeStart = allStarts.length
    ? new Date(Math.min(...allStarts))
    : new Date(today.getFullYear(), today.getMonth() - 1, 1)

  const rangeEnd = allEnds.length
    ? new Date(Math.max(...allEnds, today.getTime() + 30 * 86400000))
    : new Date(today.getFullYear(), today.getMonth() + 4, 1)

  // Pad range by 2 weeks on each side
  const viewStart = new Date(rangeStart)
  viewStart.setDate(viewStart.getDate() - 14)
  viewStart.setDate(1) // snap to month start

  const viewEnd = new Date(rangeEnd)
  viewEnd.setDate(viewEnd.getDate() + 14)
  viewEnd.setMonth(viewEnd.getMonth() + 1, 0) // snap to month end

  const totalMs = viewEnd - viewStart
  const months = getMonthsBetween(viewStart, viewEnd)

  const pct = (date) => Math.max(0, Math.min(1, (date - viewStart) / totalMs)) * 100

  const todayPct = pct(today)

  const chartHeight = sorted.length * ROW_HEIGHT + HEADER_HEIGHT + 24

  return (
    <div style={{ padding: '24px', height: 'calc(100vh - 52px)', overflowY: 'auto', boxSizing: 'border-box' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
            Timeline
          </h2>
          <p style={{ color: '#444', fontSize: '12px', margin: '4px 0 0', fontFamily: 'DM Mono, monospace' }}>
            Gantt view — deals by expected close date
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Deal picker */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker(p => !p)}
              style={{
                background: hiddenDeals.size ? 'rgba(124,106,247,0.1)' : 'transparent',
                border: `1px solid ${hiddenDeals.size ? '#4a3fa0' : '#2a2a2a'}`,
                borderRadius: '5px',
                color: hiddenDeals.size ? '#9d8fff' : '#555',
                cursor: 'pointer',
                fontFamily: 'DM Mono, monospace',
                fontSize: '11px',
                padding: '4px 10px',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
              }}
            >
              {hiddenDeals.size ? `${deals.length - hiddenDeals.size}/${deals.length} deals` : 'Select deals'} ▾
            </button>

            {showPicker && (
              <div
                style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#111', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '8px 0', zIndex: 50, minWidth: '220px', maxHeight: '320px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}
                onMouseLeave={() => setShowPicker(false)}
              >
                {/* All / None shortcuts */}
                <div style={{ display: 'flex', gap: '8px', padding: '4px 12px 8px', borderBottom: '1px solid #1a1a1a', marginBottom: '4px' }}>
                  <button onClick={() => toggleAll(true)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', padding: 0 }}>All</button>
                  <span style={{ color: '#2a2a2a' }}>·</span>
                  <button onClick={() => toggleAll(false)} style={{ background: 'none', border: 'none', color: '#666', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', padding: 0 }}>None</button>
                </div>
                {deals.map(d => {
                  const sc = STAGE_COLORS[d.stage] || STAGE_COLORS['Sourced']
                  const visible = !hiddenDeals.has(d.id)
                  return (
                    <label
                      key={d.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', cursor: 'pointer', opacity: visible ? 1 : 0.4 }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <input
                        type="checkbox"
                        checked={visible}
                        onChange={() => toggleDeal(d.id)}
                        style={{ accentColor: '#7c6af7', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, color: '#ccc', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.company_name}</span>
                      <span style={{ flexShrink: 0, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: '3px', fontSize: '9px', padding: '1px 5px', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>{d.stage}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Stage filter */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['all', ...STAGES].map(s => {
              const color = s === 'all' ? null : STAGE_COLORS[s]
              const active = filterStage === s
              return (
                <button
                  key={s}
                  onClick={() => setFilterStage(s)}
                  style={{
                    background: active
                      ? (color ? color.bg : 'rgba(255,255,255,0.08)')
                      : 'transparent',
                    border: `1px solid ${active ? (color ? color.border : '#555') : '#2a2a2a'}`,
                    borderRadius: '5px',
                    color: active ? (color ? color.text : '#f0f0f0') : '#444',
                    cursor: 'pointer',
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '11px',
                    padding: '4px 10px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {sorted.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#333', fontSize: '13px', fontFamily: 'DM Mono, monospace' }}>
          No deals to display.
        </div>
      )}

      {sorted.length > 0 && (
        <div style={{ display: 'flex', background: '#0f0f0f', border: '1px solid #1f1f1f', borderRadius: '10px', overflow: 'hidden' }}>

          {/* Left labels column */}
          <div style={{ width: `${LABEL_WIDTH}px`, flexShrink: 0, borderRight: '1px solid #1f1f1f' }}>
            {/* Header spacer */}
            <div style={{ height: `${HEADER_HEIGHT}px`, borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
              <span style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'DM Mono, monospace' }}>
                Deal
              </span>
            </div>
            {sorted.map((deal) => {
              const sc = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
              return (
                <div
                  key={deal.id}
                  onClick={() => onOpenDeal(deal)}
                  style={{
                    height: `${ROW_HEIGHT}px`,
                    borderBottom: '1px solid #141414',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#141414'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: '#ddd', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {deal.company_name}
                    </div>
                    {deal.raise_amount && (
                      <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace', marginTop: '1px' }}>
                        {formatCurrency(deal.raise_amount)}
                      </div>
                    )}
                  </div>
                  <span style={{
                    flexShrink: 0,
                    background: sc.bg,
                    color: sc.text,
                    border: `1px solid ${sc.border}`,
                    borderRadius: '4px',
                    fontSize: '9px',
                    padding: '2px 6px',
                    fontFamily: 'DM Mono, monospace',
                    letterSpacing: '0.03em',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                  }}>
                    {deal.stage}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Chart area */}
          <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
            <div style={{ minWidth: '600px', height: `${chartHeight}px`, position: 'relative' }}>

              {/* Month header */}
              <div style={{
                height: `${HEADER_HEIGHT}px`,
                borderBottom: '1px solid #1f1f1f',
                display: 'flex',
                position: 'sticky',
                top: 0,
                background: '#0f0f0f',
                zIndex: 2,
              }}>
                {months.map((m, i) => {
                  const left = pct(m)
                  const next = months[i + 1] ? pct(months[i + 1]) : 100
                  const width = next - left
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px',
                        boxSizing: 'border-box',
                        borderLeft: '1px solid #1a1a1a',
                      }}
                    >
                      <span style={{ fontSize: '10px', color: '#3a3a3a', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                        {m.toLocaleString('default', { month: 'short' })} {m.getFullYear() !== today.getFullYear() ? m.getFullYear() : ''}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Vertical month grid lines */}
              {months.map((m, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: `${pct(m)}%`,
                  top: `${HEADER_HEIGHT}px`,
                  bottom: 0,
                  width: '1px',
                  background: '#141414',
                  zIndex: 0,
                }} />
              ))}

              {/* Today line */}
              <div style={{
                position: 'absolute',
                left: `${todayPct}%`,
                top: `${HEADER_HEIGHT}px`,
                bottom: 0,
                width: '1px',
                background: '#7c6af7',
                opacity: 0.7,
                zIndex: 3,
              }} />
              <div style={{
                position: 'absolute',
                left: `${todayPct}%`,
                top: `${HEADER_HEIGHT + 6}px`,
                transform: 'translateX(-50%)',
                background: '#7c6af7',
                color: '#fff',
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontFamily: 'DM Mono, monospace',
                whiteSpace: 'nowrap',
                zIndex: 4,
              }}>
                Today
              </div>

              {/* Deal rows */}
              {sorted.map((deal, i) => {
                const sc = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
                const startDate = toDateObj(deal.created_at) || today
                const endDate = toDateObj(deal.expected_close_date)

                const rowTop = HEADER_HEIGHT + i * ROW_HEIGHT
                const barTop = rowTop + (ROW_HEIGHT - BAR_HEIGHT) / 2

                const startPct = pct(startDate)
                const endPct = endDate ? pct(endDate) : Math.min(pct(today) + 4, 100)
                const barWidth = Math.max(endPct - startPct, 0.8)

                const hasNoCloseDate = !endDate

                return (
                  <div key={deal.id}>
                    {/* Row background */}
                    <div style={{
                      position: 'absolute',
                      left: 0, right: 0,
                      top: `${rowTop}px`,
                      height: `${ROW_HEIGHT}px`,
                      borderBottom: '1px solid #141414',
                    }} />

                    {/* Bar */}
                    <div
                      onClick={() => onOpenDeal(deal)}
                      title={`${deal.company_name}\nStart: ${startDate.toLocaleDateString()}\nClose: ${endDate ? endDate.toLocaleDateString() : 'TBD'}`}
                      style={{
                        position: 'absolute',
                        left: `${startPct}%`,
                        width: `${barWidth}%`,
                        top: `${barTop}px`,
                        height: `${BAR_HEIGHT}px`,
                        background: sc.bg,
                        border: `1px solid ${sc.border}`,
                        borderRight: hasNoCloseDate ? `2px dashed ${sc.border}` : `1px solid ${sc.border}`,
                        borderRadius: `${BAR_RADIUS}px`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: '8px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        zIndex: 1,
                        transition: 'filter 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.4)'}
                      onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                    >
                      <span style={{
                        fontSize: '10px',
                        color: sc.text,
                        fontFamily: 'DM Mono, monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {deal.company_name}
                        {hasNoCloseDate && <span style={{ opacity: 0.5 }}> (TBD)</span>}
                      </span>
                    </div>

                    {/* Close date label */}
                    {endDate && (
                      <div style={{
                        position: 'absolute',
                        left: `calc(${endPct}% + 5px)`,
                        top: `${barTop + 4}px`,
                        fontSize: '9px',
                        color: '#333',
                        fontFamily: 'DM Mono, monospace',
                        whiteSpace: 'nowrap',
                        zIndex: 1,
                      }}>
                        {endDate.toLocaleDateString('default', { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#333', fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend:</span>
        {STAGES.map(stage => {
          const sc = STAGE_COLORS[stage]
          return (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '20px', height: '8px', background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '3px' }} />
              <span style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace' }}>{stage}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '20px', height: '8px', background: '#1a1155', border: '1px dashed #4a3fa0', borderRadius: '3px' }} />
          <span style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace' }}>No close date set</span>
        </div>
      </div>
    </div>
  )
}
