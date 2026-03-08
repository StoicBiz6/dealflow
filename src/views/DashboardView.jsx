import { useState } from 'react'
import { STAGES, STAGE_COLORS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

export default function DashboardView({ deals, onOpenDeal }) {
  const totalRaise = deals.reduce((s, d) => s + (d.raise_amount || 0), 0)
  const activeDeals = deals.filter(d => !['Closed', 'Passed'].includes(d.stage))
  const closedDeals = deals.filter(d => d.stage === 'Closed')
  const avgRaise = deals.length ? totalRaise / deals.length : 0

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

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* KPI Row */}
      <div className="dashboard-grid-kpi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KPI label="Total Pipeline" value={formatCurrency(totalRaise)} sub={`${deals.length} deals`} />
        <KPI label="Active Deals" value={activeDeals.length} sub="in progress" accent />
        <KPI label="Closed Deals" value={closedDeals.length} sub={formatCurrency(closedDeals.reduce((s,d)=>s+(d.raise_amount||0),0))} />
        <KPI label="Avg Raise" value={formatCurrency(avgRaise)} sub="per deal" />
      </div>

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
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ color: '#888', fontSize: '12px', minWidth: '60px', textAlign: 'right' }}>
                    {formatCurrency(deal.raise_amount)}
                  </span>
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

function KPI({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#111111', border: '1px solid #1f1f1f',
      borderRadius: '10px', padding: '18px 20px',
    }}>
      <div style={{ color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700,
        color: accent ? '#7c6af7' : '#f0f0f0', lineHeight: 1, marginBottom: '6px',
      }}>
        {value}
      </div>
      <div style={{ color: '#555', fontSize: '11px' }}>{sub}</div>
    </div>
  )
}
