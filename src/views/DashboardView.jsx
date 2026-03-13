import { useState } from 'react'
import { STAGES, STAGE_COLORS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

export default function DashboardView({ deals, onOpenDeal }) {
  const totalRaise = deals.reduce((s, d) => s + (d.raise_amount || 0), 0)
  const activeDeals = deals.filter(d => !['Closed', 'Passed'].includes(d.stage))
  const closedDeals = deals.filter(d => d.stage === 'Closed')
  const totalFees = deals.reduce((s, d) => s + (d.raise_amount && d.fee_pct ? d.raise_amount * d.fee_pct / 100 : 0), 0)
  const dealsWithFees = deals.filter(d => d.raise_amount && d.fee_pct)

  // Stale deals: active deals not updated in 14+ days
  const now = Date.now()
  const staleDeals = activeDeals
    .map(d => ({ ...d, daysSince: Math.floor((now - new Date(d.updated_at || d.created_at)) / 86400000) }))
    .filter(d => d.daysSince >= 14)
    .sort((a, b) => b.daysSince - a.daysSince)

  // Fee pipeline: active deals with fee data
  const feeDeals = activeDeals
    .filter(d => d.raise_amount && d.fee_pct)
    .map(d => ({ ...d, projectedFee: Math.round(d.raise_amount * d.fee_pct / 100) }))
    .sort((a, b) => b.projectedFee - a.projectedFee)
  const activeFeeTotal = feeDeals.reduce((s, d) => s + d.projectedFee, 0)

  const bySector = {}
  deals.forEach(d => {
    const s = d.sector || 'Other'
    bySector[s] = (bySector[s] || 0) + 1
  })
  const topSectors = Object.entries(bySector).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const byStage = {}
  STAGES.forEach(s => { byStage[s] = { count: 0, raise: 0, deals: [] } })
  deals.forEach(d => {
    if (byStage[d.stage]) {
      byStage[d.stage].count++
      byStage[d.stage].raise += d.raise_amount || 0
      byStage[d.stage].deals.push(d)
    }
  })

  const [expandedStage, setExpandedStage] = useState(null)
  const [staleCollapsed, setStaleCollapsed] = useState(false)

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Stale Deal Alerts */}
      {staleDeals.length > 0 && (
        <div style={{
          marginBottom: '20px',
          background: '#111',
          border: '1px solid #2a1a00',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <div
            onClick={() => setStaleCollapsed(c => !c)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 16px', cursor: 'pointer',
              background: 'rgba(251,146,60,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fb923c', fontSize: '13px' }}>⚠</span>
              <span style={{ color: '#fb923c', fontSize: '12px', fontFamily: 'DM Mono, monospace', fontWeight: 600, letterSpacing: '0.04em' }}>
                {staleDeals.length} STALE DEAL{staleDeals.length > 1 ? 'S' : ''}
              </span>
              <span style={{ color: '#666', fontSize: '11px' }}>— no activity in 14+ days</span>
            </div>
            <span style={{ color: '#555', fontSize: '11px' }}>{staleCollapsed ? '▼' : '▲'}</span>
          </div>
          {!staleCollapsed && (
            <div style={{ padding: '8px 12px 12px' }}>
              {staleDeals.map(deal => {
                const isCritical = deal.daysSince >= 30
                const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
                return (
                  <div
                    key={deal.id}
                    onClick={() => onOpenDeal?.(deal)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                      marginBottom: '2px', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: '#f0f0f0' }}>
                        {deal.company_name}
                      </span>
                      <span style={{
                        background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                        borderRadius: '4px', padding: '1px 7px', fontSize: '10px',
                      }}>
                        {deal.stage}
                      </span>
                    </div>
                    <span style={{
                      color: isCritical ? '#f87171' : '#fb923c',
                      fontSize: '11px', fontFamily: 'DM Mono, monospace',
                    }}>
                      {deal.daysSince}d ago
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* KPI Row */}
      <div className="dashboard-grid-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KPI label="Total Pipeline" value={formatCurrency(totalRaise)} sub={`${deals.length} deals`} />
        <KPI label="Active Deals" value={activeDeals.length} sub="in progress" accent />
        <KPI label="Closed Deals" value={closedDeals.length} sub={formatCurrency(closedDeals.reduce((s,d)=>s+(d.raise_amount||0),0))} />
        <KPI label="Est. Fees" value={totalFees ? formatCurrency(totalFees) : '—'} sub={dealsWithFees.length ? `across ${dealsWithFees.length} deal${dealsWithFees.length > 1 ? 's' : ''}` : 'set fee % on deals'} fee />
      </div>

      {/* Fee Pipeline Projection */}
      {feeDeals.length > 0 && (
        <div style={{ marginBottom: '12px', background: '#111111', border: '1px solid rgba(124,106,247,0.2)', borderRadius: '10px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0f0f0', margin: 0 }}>
              Fee Pipeline
            </h3>
            <span style={{ color: '#9d8fff', fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700 }}>
              {formatCurrency(activeFeeTotal)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {feeDeals.map(deal => {
              const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
              const pct = activeFeeTotal ? (deal.projectedFee / activeFeeTotal) * 100 : 0
              return (
                <div
                  key={deal.id}
                  onClick={() => onOpenDeal?.(deal)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center',
                    padding: '7px 8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', color: '#e5e5e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {deal.company_name}
                    </span>
                    <span style={{
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                      borderRadius: '4px', padding: '1px 6px', fontSize: '9px', flexShrink: 0,
                    }}>
                      {deal.stage}
                    </span>
                    <div style={{ flex: 1, height: '2px', background: '#1a1a1a', borderRadius: '1px', overflow: 'hidden', minWidth: '30px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: '#7c6af7', opacity: 0.6 }} />
                    </div>
                  </div>
                  <span style={{ color: '#555', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {formatCurrency(deal.raise_amount)} × {deal.fee_pct}%
                  </span>
                  <span style={{ color: '#9d8fff', fontSize: '12px', fontWeight: 600, minWidth: '70px', textAlign: 'right' }}>
                    {formatCurrency(deal.projectedFee)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stage breakdown + Sector breakdown */}
      <div className="dashboard-grid-main" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
        {/* Stage funnel */}
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0f0f0', marginBottom: '16px' }}>
            Pipeline by Stage
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {STAGES.map(stage => {
              const data = byStage[stage]
              const colors = STAGE_COLORS[stage]
              const pct = deals.length ? (data.count / deals.length) * 100 : 0
              const isExpanded = expandedStage === stage

              return (
                <div key={stage}>
                  <div
                    onClick={() => setExpandedStage(isExpanded ? null : stage)}
                    style={{ cursor: data.count > 0 ? 'pointer' : 'default', padding: '8px 6px', borderRadius: '6px', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (data.count > 0) e.currentTarget.style.background = '#161616' }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: colors.text, fontSize: '12px' }}>{stage}</span>
                        {data.count > 0 && (
                          <span style={{ color: '#444', fontSize: '10px' }}>{isExpanded ? '▲' : '▼'}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <span style={{ color: '#555', fontSize: '12px' }}>{data.count} deals</span>
                        <span style={{ color: '#888', fontSize: '12px', minWidth: '60px', textAlign: 'right' }}>
                          {formatCurrency(data.raise)}
                        </span>
                      </div>
                    </div>
                    <div style={{ height: '4px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`, background: colors.text,
                        borderRadius: '2px', transition: 'width 0.5s ease', opacity: 0.7,
                      }} />
                    </div>
                  </div>

                  {/* Expanded deals list */}
                  {isExpanded && data.deals.length > 0 && (
                    <div style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '8px', borderLeft: `2px solid ${colors.border}` }}>
                      {data.deals.map(deal => (
                        <div
                          key={deal.id}
                          onClick={() => onOpenDeal?.(deal)}
                          style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '7px 10px', borderRadius: '6px', cursor: 'pointer',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#1a1a1a'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', color: '#e5e5e5' }}>
                            {deal.company_name}
                          </span>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {deal.sector && <span style={{ color: '#555', fontSize: '11px' }}>{deal.sector}</span>}
                            <span style={{ color: '#888', fontSize: '12px' }}>{formatCurrency(deal.raise_amount)}</span>
                            <span style={{ color: '#444', fontSize: '11px' }}>→</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Sector breakdown */}
        <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0f0f0', marginBottom: '16px' }}>
            Top Sectors
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topSectors.length === 0 && (
              <div style={{ color: '#555', fontSize: '12px' }}>No data yet</div>
            )}
            {topSectors.map(([sector, count]) => (
              <div key={sector} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '12px' }}>{sector}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '60px', height: '3px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(count / deals.length) * 100}%`,
                      background: '#7c6af7', borderRadius: '2px',
                    }} />
                  </div>
                  <span style={{ color: '#555', fontSize: '11px', minWidth: '16px', textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Deals */}
      <div style={{ marginTop: '12px', background: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 600, color: '#f0f0f0', marginBottom: '16px' }}>
          All Deals
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {deals.slice(0, 20).map(deal => {
            const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
            const daysSince = Math.floor((now - new Date(deal.updated_at || deal.created_at)) / 86400000)
            const isStale = daysSince >= 14 && !['Closed', 'Passed'].includes(deal.stage)
            return (
              <div
                key={deal.id}
                onClick={() => onOpenDeal?.(deal)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 8px', borderRadius: '6px', cursor: 'pointer',
                  borderBottom: '1px solid #1a1a1a', transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', color: '#f0f0f0', minWidth: '160px' }}>
                    {deal.company_name}
                  </span>
                  <span style={{ color: '#555', fontSize: '11px', minWidth: '80px' }}>{deal.sector || '—'}</span>
                  {isStale && (
                    <span style={{ color: daysSince >= 30 ? '#f87171' : '#fb923c', fontSize: '10px', fontFamily: 'DM Mono, monospace' }}>
                      {daysSince}d ago
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#888', fontSize: '12px', minWidth: '60px', textAlign: 'right' }}>
                    {formatCurrency(deal.raise_amount)}
                  </span>
                  {deal.fee_pct != null && deal.raise_amount ? (
                    <span style={{ color: '#9d8fff', fontSize: '11px', minWidth: '70px', textAlign: 'right' }}>
                      {deal.fee_pct}% · {formatCurrency(deal.raise_amount * deal.fee_pct / 100)}
                    </span>
                  ) : (
                    <span style={{ minWidth: '70px' }} />
                  )}
                  <span style={{
                    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                    borderRadius: '4px', padding: '2px 8px', fontSize: '10px', minWidth: '120px', textAlign: 'center',
                  }}>
                    {deal.stage}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, accent, fee }) {
  return (
    <div style={{
      background: '#111111', border: `1px solid ${fee ? 'rgba(124,106,247,0.25)' : '#1f1f1f'}`,
      borderRadius: '10px', padding: '18px 20px',
    }}>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700,
        color: accent ? '#7c6af7' : fee ? '#9d8fff' : '#f0f0f0', lineHeight: 1, marginBottom: '6px',
      }}>
        {value}
      </div>
      <div style={{ color: '#555', fontSize: '11px' }}>{sub}</div>
    </div>
  )
}
