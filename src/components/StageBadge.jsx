import { STAGE_COLORS } from '../lib/constants'

export default function StageBadge({ stage, size = 'sm' }) {
  const colors = STAGE_COLORS[stage] || STAGE_COLORS['Sourced']
  const padding = size === 'xs' ? '2px 6px' : '3px 8px'
  const fontSize = size === 'xs' ? '10px' : '11px'

  return (
    <span
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        borderRadius: '4px',
        padding,
        fontSize,
        fontFamily: 'DM Mono, monospace',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {stage}
    </span>
  )
}
