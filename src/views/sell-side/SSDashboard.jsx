import { useMandateContext } from '../../components/sell-side/SellShell'
import { useNavigate } from 'react-router-dom'
import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

const parseNotes = (notes) => { try { const p = JSON.parse(notes || '{}'); return typeof p === 'object' ? p : {} } catch { return {} } }

const STAGE_COLOR = {
  'Prep phase': 'gray', 'NDA / CIM': 'blue', 'Mgmt meetings': 'blue',
  'First round bids': 'amber', 'Final round': 'amber', 'Exclusivity': 'green', 'Sign & close': 'green',
}

function fmtEV(m) {
  if (m.ev_low && m.ev_high) return `$${m.ev_low}-${m.ev_high}M`
  if (m.ev_low) return `$${m.ev_low}M+`
  if (m.ev_high) return `up to $${m.ev_high}M`
  return '—'
}

function fmtRetainer(n) {
  if (!n) return '—'
  if (n >= 1000000) return `$${(n/1000000).toFixed(1)}M/mo`
  if (n >= 1000) return `$${Math.round(n/1000)}k/mo`
  return `$${n}/mo`
}

export default function SSDashboard() {
  const { mandates, loading, deleteMandate, setActiveMandateId } = useMandateContext()
  const navigate = useNavigate()

  const totalEV = mandates.reduce((s, m) => s + ((m.ev_low || 0) + (m.ev_high || 0)) / 2, 0)
  const inExclusivity = mandates.filter(m => m.stage === 'Exclusivity' || m.stage === 'Sign & close').length
  const active = mandates.filter(m => m.stage !== 'Sign & close').length
  const totalRetainer = mandates.reduce((s, m) => s + (m.retainer || 0), 0)

  if (loading) return <div style={{color:c.text3,fontSize:13}}>Loading...</div>

  return (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:10}}>
        {[
          { label:'Active mandates', value: active, sub: `${mandates.length} total` },
          { label:'Total EV range', value: totalEV ? `~$${Math.round(totalEV)}M` : '—', sub: 'blended midpoint' },
          { label:'In exclusivity', value: inExclusivity, sub: inExclusivity === 1 ? '1 process' : `${inExclusivity} processes` },
          { label:'Monthly retainers', value: totalRetainer ? fmtRetainer(totalRetainer) : '—', sub: 'across all mandates' },
        ].map(k => (
          <div key={k.label} style={kpi.card}>
            <div style={kpi.label}>{k.label}</div>
            <div style={kpi.value}>{k.value}</div>
            <div style={kpi.sub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={panel.wrap}>
        <div style={{...panel.title, marginBottom:16}}>Active mandates</div>
        {mandates.length === 0 ? (
          <div style={{color:c.text3,fontSize:13}}>No mandates yet — click "+ New Mandate" to get started.</div>
        ) : (
          <>
            <div style={{...table.row, gridTemplateColumns:'1fr 90px 90px 100px 110px 110px 140px 32px', paddingBottom:8, borderBottom:'0.5px solid rgba(255,255,255,0.11)'}}>
              <span style={table.header}>Name</span>
              <span style={table.header}>Revenue</span>
              <span style={table.header}>EBITDA</span>
              <span style={table.header}>EV range</span>
              <span style={table.header}>Success fee</span>
              <span style={table.header}>Retainer</span>
              <span style={table.header}>Stage</span>
              <span/>
            </div>
            {mandates.map(m => {
              const mx = parseNotes(m.notes).metrics || {}
              return (
                <div key={m.id} style={{...table.row, gridTemplateColumns:'1fr 90px 90px 100px 110px 110px 140px 32px', cursor:'pointer'}}
                  onClick={() => { setActiveMandateId(m.id); navigate(`/sell/deal/${m.id}`) }}>
                  <div>
                    <div style={table.name}>{m.name}</div>
                    {m.sector && <div style={table.sub}>{m.sector}</div>}
                  </div>
                  <div style={table.mono}>{mx.revenue || '—'}</div>
                  <div style={table.mono}>{mx.ebitda || '—'}</div>
                  <div style={table.mono}>{fmtEV(m)}</div>
                  <div style={{fontSize:12,color:c.text2}}>{m.success_fee || '—'}</div>
                  <div style={{fontSize:12,color:c.text2}}>{m.retainer ? fmtRetainer(m.retainer) : '—'}</div>
                  <div><span style={pill(STAGE_COLOR[m.stage] || 'gray')}>{m.stage}</span></div>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm(`Delete ${m.name}?`)) deleteMandate(m.id) }}
                    style={{background:'none',border:'none',color:'#444',cursor:'pointer',fontSize:14,padding:'2px 4px'}}
                  >×</button>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
