import { kpi, pill, panel, table, c } from '../../components/sell-side/ssStyles'

const BIDS = [
  { name: 'KKR',               type: 'Sponsor',   amount: '$210M', mult: '17.8×', structure: 'All cash',        rollover: '—',   sc: 'green' },
  { name: 'Oracle Health',     type: 'Strategic', amount: '$205M', mult: '17.4×', structure: 'All cash',        rollover: '—',   sc: 'green' },
  { name: 'Veritas Capital',   type: 'Sponsor',   amount: '$198M', mult: '16.8×', structure: 'Cash + rollover', rollover: '10%', sc: 'green' },
  { name: 'Blackstone Growth', type: 'Sponsor',   amount: '$185M', mult: '15.7×', structure: 'Cash + rollover', rollover: '15%', sc: 'green' },
  { name: 'Amwell',            type: 'Strategic', amount: '$172M', mult: '14.6×', structure: 'Cash + stock',    rollover: '20%', sc: 'amber' },
  { name: 'TA Associates',     type: 'Sponsor',   amount: '$165M', mult: '14.0×', structure: 'Cash + rollover', rollover: '12%', sc: 'blue'  },
]

export default function SSBids() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10 }}>
        {[
          { label: 'High bid',          value: '$210M',    sub: 'KKR — all cash' },
          { label: 'Median bid',        value: '$192M',    sub: 'across 6 bids' },
          { label: 'Seller range',      value: '$180–220M',sub: 'board expectation' },
          { label: 'Implied EV/EBITDA', value: '14–18×',   sub: 'based on bids received' },
        ].map(k => (
          <div key={k.label} style={kpi.card}>
            <div style={kpi.label}>{k.label}</div>
            <div style={kpi.value}>{k.value}</div>
            <div style={kpi.sub}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={panel.wrap}>
        <div style={panel.title}>Bid comparison — Project Falcon</div>
        <div style={{ ...table.row, gridTemplateColumns: '1fr 80px 80px 130px 70px 110px', paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.11)' }}>
          {['Buyer','Bid','EV/EBITDA','Structure','Rollover','Status'].map(h => <span key={h} style={table.header}>{h}</span>)}
        </div>
        {BIDS.map(b => (
          <div key={b.name} style={{ ...table.row, gridTemplateColumns: '1fr 80px 80px 130px 70px 110px' }}>
            <div><div style={table.name}>{b.name}</div><div style={table.sub}>{b.type}</div></div>
            <div style={table.mono}>{b.amount}</div>
            <div style={{ ...table.mono, fontSize: 12 }}>{b.mult}</div>
            <div style={{ fontSize: 11, color: c.text2 }}>{b.structure}</div>
            <div style={{ fontSize: 11, color: c.text2 }}>{b.rollover}</div>
            <div><span style={pill(b.sc)}>{b.sc === 'green' ? 'Final round' : b.sc === 'amber' ? 'LOI pending' : 'IOI only'}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}
