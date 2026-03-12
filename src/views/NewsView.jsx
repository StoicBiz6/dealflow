import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STAGE_COLORS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

const card = { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
const TYPE_COLORS = { PE: '#818cf8', VC: '#60a5fa', 'Growth Equity': '#60a5fa', 'Family Office': '#34d399', Strategic: '#fbbf24' }

export default function NewsView({ deals }) {
  const navigate = useNavigate()
  const [newsMap, setNewsMap] = useState({}) // dealId -> { loading, data, error }
  const [loadingAll, setLoadingAll] = useState(false)

  const loadForDeal = async (deal) => {
    setNewsMap(m => ({ ...m, [deal.id]: { loading: true, data: null, error: null } }))
    try {
      const res = await fetch('/api/deal-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal }),
      })
      const data = await res.json()
      setNewsMap(m => ({ ...m, [deal.id]: { loading: false, data: data.error ? null : data, error: data.error || null } }))
    } catch (e) {
      setNewsMap(m => ({ ...m, [deal.id]: { loading: false, data: null, error: e.message } }))
    }
  }

  const loadAll = async () => {
    setLoadingAll(true)
    await Promise.all(deals.map(d => loadForDeal(d)))
    setLoadingAll(false)
  }

  const activeDeals = deals.filter(d => d.stage !== 'Closed' && d.stage !== 'Passed')
  const displayDeals = activeDeals.length > 0 ? activeDeals : deals

  return (
    <div style={{ padding: '28px 32px 48px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: '#f0f0f0', margin: '0 0 4px' }}>
            Deal News
          </h1>
          <div style={{ color: '#444', fontSize: '12px' }}>
            Market intelligence · Comparable transactions · Active investors
          </div>
        </div>
        <button
          onClick={loadAll}
          disabled={loadingAll || displayDeals.length === 0}
          style={{
            background: 'rgba(124,106,247,0.1)',
            border: '1px solid #4a3fa0',
            color: loadingAll ? '#555' : '#9d8fff',
            borderRadius: '6px',
            padding: '8px 18px',
            cursor: loadingAll ? 'default' : 'pointer',
            fontSize: '12px',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          {loadingAll ? 'Loading all deals…' : '✦ Load All'}
        </button>
      </div>

      {/* Empty state */}
      {displayDeals.length === 0 && (
        <div style={{ color: '#333', fontSize: '14px', textAlign: 'center', padding: '80px 0' }}>
          No deals yet. Add deals to see market intelligence.
        </div>
      )}

      {/* Deal cards */}
      {displayDeals.map(deal => {
        const state = newsMap[deal.id]
        const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
        const hasData = state?.data
        const isLoading = state?.loading

        return (
          <div key={deal.id} style={card}>

            {/* Deal header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: hasData || isLoading ? '20px' : 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', cursor: 'pointer', flex: 1, minWidth: 0 }}
                onClick={() => navigate(`/deal/${deal.id}`)}
                title="Open deal page"
              >
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '15px', fontWeight: 700, color: '#f0f0f0' }}>
                  {deal.company_name}
                </span>
                <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '1px 8px', fontSize: '10px', flexShrink: 0 }}>
                  {deal.stage}
                </span>
                {deal.sector && (
                  <span style={{ color: '#555', fontSize: '11px' }}>{deal.sector}</span>
                )}
                {deal.raise_amount && (
                  <span style={{ color: '#444', fontSize: '11px', marginLeft: 'auto' }}>{formatCurrency(deal.raise_amount)}</span>
                )}
              </div>

              <button
                onClick={() => loadForDeal(deal)}
                disabled={isLoading}
                style={{
                  background: 'rgba(124,106,247,0.1)',
                  border: '1px solid #4a3fa0',
                  color: isLoading ? '#555' : '#9d8fff',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  cursor: isLoading ? 'default' : 'pointer',
                  fontSize: '11px',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {isLoading ? 'Loading…' : hasData ? '↺ Refresh' : '✦ Load Intel'}
              </button>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div style={{ color: '#555', fontSize: '12px', padding: '16px 0', textAlign: 'center' }}>
                Scanning market for {deal.company_name}…
              </div>
            )}

            {/* Error state */}
            {state?.error && !isLoading && (
              <div style={{ color: '#f87171', fontSize: '12px', padding: '8px 0' }}>
                Error: {state.error}
              </div>
            )}

            {/* News data */}
            {hasData && !isLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Comparable Transactions — grid */}
                {state.data.comparable_deals?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                      Comparable Transactions
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                      {state.data.comparable_deals.map((item, i) => (
                        <div key={i} style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '8px' }}>
                            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '12px', fontWeight: 600, color: '#e5e5e5', lineHeight: 1.3 }}>
                              {item.title}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                              {item.amount && (
                                <span style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: '4px', padding: '1px 6px', color: '#9d8fff', fontSize: '10px' }}>
                                  {item.amount}
                                </span>
                              )}
                              {item.date && <span style={{ color: '#444', fontSize: '10px' }}>{item.date}</span>}
                            </div>
                          </div>
                          {item.investors?.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '5px' }}>
                              {item.investors.map((inv, j) => (
                                <span key={j} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px', padding: '1px 5px', color: '#666', fontSize: '10px' }}>
                                  {inv}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.relevance && (
                            <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{item.relevance}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investors + Trends — two columns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                  {state.data.active_investors?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                        Active Investors
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {state.data.active_investors.map((inv, i) => (
                          <div key={i} style={{ padding: '8px 12px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: inv.recent_activity ? '3px' : 0 }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#e5e5e5' }}>{inv.name}</span>
                              {inv.type && (
                                <span style={{ color: TYPE_COLORS[inv.type] || '#888', fontSize: '10px', flexShrink: 0 }}>{inv.type}</span>
                              )}
                            </div>
                            {inv.recent_activity && (
                              <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{inv.recent_activity}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.data.market_trends?.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
                        Sector Trends
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {state.data.market_trends.map((t, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 12px', background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px' }}>
                            <span style={{ color: '#7c6af7', fontSize: '13px', flexShrink: 0, marginTop: '1px' }}>↗</span>
                            <div>
                              <div style={{ color: '#ccc', fontSize: '12px', fontWeight: 500, marginBottom: '2px' }}>{t.trend}</div>
                              {t.detail && <div style={{ color: '#555', fontSize: '11px', lineHeight: 1.5 }}>{t.detail}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ color: '#252525', fontSize: '10px', textAlign: 'right' }}>
                  Based on AI market knowledge through early 2025
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
