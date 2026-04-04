import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

const MANDATES = [
  { name: 'Project Falcon', sector: 'Healthcare SaaS',  ev: '$180–220M', stage: 'First round bids', stageColor: 'amber', days: 74  },
  { name: 'Project Summit', sector: 'Industrial tech',   ev: '$90–120M',  stage: 'NDA / CIM',       stageColor: 'blue',  days: 112 },
  { name: 'Project Nova',   sector: 'Fintech',           ev: '$250–300M', stage: 'Exclusivity',      stageColor: 'green', days: 18  },
  { name: 'Project Ember',  sector: 'Energy services',   ev: '$60–80M',   stage: 'Prep phase',       stageColor: 'gray',  days: 149 },
]

const ACTIVITY = [
  { color: c.green, text: 'Oracle Health submitted $205M IOI — highest bid so far',  time: '2h ago'    },
  { color: c.amber, text: 'KKR requested management call extension to Apr 10',         time: 'Yesterday' },
  { color: c.blue,  text: 'Veritas accessed data room — 38 new documents viewed',      time: '2d ago'    },
  { color: c.red,   text: 'Consonance Capital passed — valuation gap',                 time: '3d ago'    },
  { color: c.text3, text: 'Draft SPA sent to Latham & Watkins for review',             time: '4d ago'    },
]

export default function SSDashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
        {[
          { label: 'Active processes',  value: '4',    sub: '$680M in play' },
          { label: 'Buyers engaged',    value: '87',   sub: 'across all mandates' },
          { label: 'Bids received',     value: '23',   sub: 'this quarter' },
          { label: 'In exclusivity',    value: '1',    sub: 'Project Nova' },
          { label: 'Avg days to close', value: '118',  sub: 'last 4 transactions' },
        ].map(k => (
          <div key={k.label} style={kpi.card}>
            <div style={kpi.label}>{k.label}</div>
            <div style={kpi.value}>{k.value}</div>
            <div style={kpi.sub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14 }}>
        <div style={panel.wrap}>
          <div style={panel.title}>Active mandates</div>
          <div style={{ borderBottom: '0.5px solid rgba(255,255,255,0.07)', paddingBottom: 8, display: 'grid', gridTemplateColumns: '1fr 80px 120px 64px 60px', gap: 10 }}>
            {['Company','Expected EV','Stage','Days left','Buyers'].map(h => <span key={h} style={table.header}>{h}</span>)}
          </div>
          {MANDATES.map(m => (
            <div key={m.name} style={{ ...table.row, gridTemplateColumns: '1fr 80px 120px 64px 60px' }}>
              <div><div style={table.name}>{m.name}</div><div style={table.sub}>{m.sector}</div></div>
              <div style={table.mono}>{m.ev}</div>
              <div><span style={pill(m.stageColor)}>{m.stage}</span></div>
              <div style={{ ...table.mono, color: m.days < 30 ? c.amber : c.text1 }}>{m.days}</div>
              <div style={table.sub}>—</div>
            </div>
          ))}
        </div>

        <div style={panel.wrap}>
          <div style={panel.title}>Recent activity</div>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < ACTIVITY.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0, marginTop: 5 }} />
              <div style={{ fontSize: 12, color: c.text1, flex: 1, lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontSize: 10, color: c.text3, whiteSpace: 'nowrap' }}>{a.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
