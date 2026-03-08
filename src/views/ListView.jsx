import { useState } from 'react'
import { STAGES, STAGE_COLORS } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'

export default function ListView({ deals, onEdit, onDelete }) {
  const [sort, setSort] = useState({ col: 'company_name', dir: 'asc' })
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')

  const filtered = deals
    .filter(d => {
      const q = search.toLowerCase()
      const matchSearch = !q || d.company_name?.toLowerCase().includes(q) || d.sector?.toLowerCase().includes(q)
      const matchStage = !stageFilter || d.stage === stageFilter
      return matchSearch && matchStage
    })
    .sort((a, b) => {
      const mul = sort.dir === 'asc' ? 1 : -1
      const av = a[sort.col] ?? ''
      const bv = b[sort.col] ?? ''
      if (typeof av === 'number') return (av - bv) * mul
      return String(av).localeCompare(String(bv)) * mul
    })

  const toggleSort = (col) => {
    setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }))
  }

  const SortIcon = ({ col }) => {
    if (sort.col !== col) return <span style={{ color: '#333' }}>↕</span>
    return <span style={{ color: '#7c6af7' }}>{sort.dir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div style={{ padding: '20px 24px' }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search deals..."
          style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px',
            color: '#f0f0f0', padding: '7px 12px', fontFamily: 'DM Mono, monospace',
            fontSize: '12px', outline: 'none', width: '220px',
          }}
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: '6px',
            color: stageFilter ? '#f0f0f0' : '#555', padding: '7px 12px',
            fontFamily: 'DM Mono, monospace', fontSize: '12px', outline: 'none',
          }}
        >
          <option value="">All stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color: '#555', fontSize: '11px', alignSelf: 'center', marginLeft: 'auto' }}>
          {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#111111', border: '1px solid #1f1f1f', borderRadius: '10px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f1f1f' }}>
              {[
                { col: 'company_name', label: 'Company' },
                { col: 'stage', label: 'Stage' },
                { col: 'raise_amount', label: 'Raise' },
                { col: 'valuation', label: 'Valuation' },
                { col: 'sector', label: 'Sector' },
                { col: 'deal_owner', label: 'Owner' },
                { col: 'created_at', label: 'Added' },
              ].map(({ col, label }) => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  style={{
                    padding: '10px 14px', textAlign: 'left', cursor: 'pointer',
                    color: '#555', fontSize: '10px', textTransform: 'uppercase',
                    letterSpacing: '0.06em', userSelect: 'none', fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label} <SortIcon col={col} />
                </th>
              ))}
              <th style={{ width: '40px' }} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((deal, i) => {
              const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
              return (
                <tr
                  key={deal.id}
                  onClick={() => onEdit(deal)}
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid #1a1a1a' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '11px 14px', fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0f0f0' }}>
                    {deal.company_name}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                      borderRadius: '4px', padding: '2px 8px', fontSize: '10px', whiteSpace: 'nowrap',
                    }}>
                      {deal.stage}
                    </span>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#888', fontSize: '12px' }}>{formatCurrency(deal.raise_amount)}</td>
                  <td style={{ padding: '11px 14px', color: '#555', fontSize: '12px' }}>{formatCurrency(deal.valuation)}</td>
                  <td style={{ padding: '11px 14px', color: '#555', fontSize: '12px' }}>{deal.sector || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#555', fontSize: '12px' }}>{deal.deal_owner || '—'}</td>
                  <td style={{ padding: '11px 14px', color: '#555', fontSize: '12px' }}>{formatDate(deal.created_at)}</td>
                  <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onDelete(deal.id)}
                      style={{
                        background: 'none', border: 'none', color: '#333',
                        cursor: 'pointer', fontSize: '14px', padding: '2px 6px',
                        borderRadius: '4px', transition: 'color 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                      onMouseLeave={e => e.currentTarget.style.color = '#333'}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#555', fontSize: '12px' }}>
                  No deals match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
