import { useState } from 'react'
import { STAGES, STAGE_COLORS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'
import StageBadge from '../components/StageBadge'

export default function KanbanView({ deals, onEdit, onDelete, onStageChange }) {
  const byStage = {}
  STAGES.forEach(s => { byStage[s] = [] })
  deals.forEach(d => {
    if (byStage[d.stage]) byStage[d.stage].push(d)
  })

  const [draggedId, setDraggedId] = useState(null)
  const [overStage, setOverStage] = useState(null)

  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = (e, stage) => {
    e.preventDefault()
    if (draggedId) onStageChange(draggedId, stage)
    setDraggedId(null)
    setOverStage(null)
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '20px 24px',
      overflowX: 'auto',
      minHeight: 'calc(100vh - 52px)',
      alignItems: 'flex-start',
    }}>
      {STAGES.map(stage => {
        const stageDeals = byStage[stage]
        const colors = STAGE_COLORS[stage]
        const totalRaise = stageDeals.reduce((sum, d) => sum + (d.raise_amount || 0), 0)
        const totalFee = stageDeals.reduce((sum, d) => sum + (d.raise_amount && d.fee_pct ? d.raise_amount * d.fee_pct / 100 : 0), 0)
        const isOver = overStage === stage

        return (
          <div
            key={stage}
            onDragOver={(e) => { e.preventDefault(); setOverStage(stage) }}
            onDragLeave={() => setOverStage(null)}
            onDrop={(e) => handleDrop(e, stage)}
            style={{
              minWidth: '220px',
              width: '220px',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Column header */}
            <div style={{
              background: isOver ? '#1a1a1a' : '#111111',
              border: `1px solid ${isOver ? colors.border : '#1f1f1f'}`,
              borderRadius: '8px',
              padding: '10px 12px',
              transition: 'all 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: colors.text, fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {stage}
                </span>
                <span style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  color: '#888',
                  fontSize: '10px',
                  padding: '1px 7px',
                }}>
                  {stageDeals.length}
                </span>
              </div>
              {totalRaise > 0 && (
                <div style={{ color: '#555', fontSize: '10px' }}>
                  {formatCurrency(totalRaise)} total
                </div>
              )}
              {totalFee > 0 && (
                <div style={{ color: '#6b5fcc', fontSize: '10px' }}>
                  {formatCurrency(totalFee)} est. fee
                </div>
              )}
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '40px' }}>
              {stageDeals.map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={handleDragStart}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DealCard({ deal, onEdit, onDelete, onDragStart }) {
  const [menu, setMenu] = useState(false)

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal.id)}
      onClick={() => onEdit(deal)}
      style={{
        background: '#111111',
        border: '1px solid #1f1f1f',
        borderRadius: '8px',
        padding: '12px',
        cursor: 'grab',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1f1f1f'}
    >
      {/* Company name */}
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#f0f0f0', marginBottom: '6px' }}>
        {deal.company_name}
      </div>

      {/* Raise */}
      {deal.raise_amount && (
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>
          {formatCurrency(deal.raise_amount)}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {deal.sector && (
          <span style={{ color: '#555', fontSize: '10px' }}>{deal.sector}</span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setMenu(!menu) }}
          style={{
            background: 'none', border: 'none', color: '#555', cursor: 'pointer',
            fontSize: '16px', padding: '0 2px', lineHeight: 1, marginLeft: 'auto',
          }}
        >
          ···
        </button>
      </div>

      {/* Context menu */}
      {menu && (
        <div
          style={{
            position: 'absolute', right: '8px', top: '36px', zIndex: 10,
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px',
            overflow: 'hidden', minWidth: '120px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => { setMenu(false); onEdit(deal) }} style={menuItemStyle}>Edit</button>
          <button onClick={() => { setMenu(false); onDelete(deal.id) }} style={{ ...menuItemStyle, color: '#f87171' }}>Delete</button>
        </div>
      )}
    </div>
  )
}

const menuItemStyle = {
  display: 'block', width: '100%', background: 'none', border: 'none',
  color: '#888', cursor: 'pointer', fontFamily: 'DM Mono, monospace',
  fontSize: '12px', padding: '8px 12px', textAlign: 'left',
}
