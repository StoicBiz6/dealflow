import { pill, panel, table, c } from '../../components/sell-side/ssStyles'

const STEPS = ['Prep & teaser','NDA & CIM','Mgmt meetings','First round bids','Final round & DD','Sign & close']
const DATES  = ['Mar 3','Mar 17','Mar 31','Apr 11','Apr 18','Jun 13']

const CHECKLIST = [
  { done: true,  label: 'Teaser distributed',       owner: 'SC' },
  { done: true,  label: 'CIM finalized',             owner: 'SC' },
  { done: true,  label: 'Management presentations',  owner: 'JR' },
  { done: true,  label: 'Data room opened',          owner: 'SC' },
  { done: false, label: 'Bid deadline reminder',     owner: 'SC' },
  { done: false, label: 'Select final round',        owner: 'JR' },
  { done: false, label: 'Draft SPA to buyers',       owner: 'Legal' },
  { done: false, label: 'Final bids & select winner',owner: 'JR' },
]

export default function SSProcesses() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={panel.wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: c.text1 }}>Project Falcon — Healthcare SaaS · $180–220M</span>
            <span style={pill('amber')}>First round bids due</span>
          </div>
          <span style={{ fontSize: 12, color: c.text3 }}>Lead: Sarah Chen · Mar 3, 2026</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0,1fr))', position: 'relative' }}>
          {STEPS.map((step, i) => {
            const status = i < 3 ? 'done' : i === 3 ? 'active' : 'pending'
            const dotStyle = {
              done:    { background: '#3B6D11', color: '#fff' },
              active:  { background: '#854F0B', color: '#fff' },
              pending: { background: '#202020', border: '1.5px solid rgba(255,255,255,0.11)', color: c.text3 },
            }[status]
            return (
              <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {i < STEPS.length - 1 && <div style={{ position: 'absolute', top: 10, left: '50%', width: '100%', height: 1, background: 'rgba(255,255,255,0.11)', zIndex: 0 }} />}
                <div style={{ width: 20, height: 20, borderRadius: '50%', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500, ...dotStyle }}>
                  {status === 'done' ? '✓' : status === 'active' ? '→' : i + 1}
                </div>
                <div style={{ fontSize: 10, color: c.text2, marginTop: 6, textAlign: 'center', lineHeight: 1.4 }}>{step}</div>
                <div style={{ fontSize: 9, color: c.text3, marginTop: 2, fontFamily: 'DM Mono, monospace' }}>{DATES[i]}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
        <div style={panel.wrap}>
          <div style={panel.title}>Process checklist</div>
          {CHECKLIST.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: i < CHECKLIST.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.done ? '#3B6D11' : 'transparent', border: item.done ? 'none' : '0.5px solid rgba(255,255,255,0.11)' }}>
                {item.done && <span style={{ color: '#fff', fontSize: 9 }}>✓</span>}
              </div>
              <div style={{ fontSize: 12, color: item.done ? c.text3 : c.text1, flex: 1, textDecoration: item.done ? 'line-through' : 'none' }}>{item.label}</div>
              <div style={{ fontSize: 10, color: c.text3 }}>{item.owner}</div>
            </div>
          ))}
        </div>

        <div style={panel.wrap}>
          <div style={panel.title}>Key contacts</div>
          {[
            { role: 'Lead advisor',  name: 'Sarah Chen' },
            { role: 'MD, coverage',  name: 'James Reed' },
            { role: 'Client CEO',    name: 'Marcus Holloway' },
            { role: 'Client CFO',    name: 'Priya Nair' },
            { role: 'Legal counsel', name: 'Latham & Watkins' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <span style={{ fontSize: 11, color: c.text3 }}>{item.role}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: c.text1 }}>{item.name}</span>
            </div>
          ))}
        </div>

        <div style={panel.wrap}>
          <div style={panel.title}>Bid summary</div>
          {[
            { label: 'High bid',     value: '$210M',      color: c.green },
            { label: 'Median bid',   value: '$192M',      color: c.text1 },
            { label: 'Low bid',      value: '$165M',      color: c.text2 },
            { label: 'Seller range', value: '$180–220M',  color: c.amber },
            { label: 'EV/EBITDA',    value: '14.2–17.8×', color: c.text1 },
            { label: 'EV/Revenue',   value: '4.1–5.3×',   color: c.text1 },
          ].map((b, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <span style={{ fontSize: 11, color: c.text3 }}>{b.label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: b.color, fontFamily: 'DM Mono, monospace' }}>{b.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
