import { pill, panel, table, c } from '../../components/sell-side/ssStyles'

const BUYERS = [
  { name: 'KKR',                type: 'Sponsor',   bid: '$210M', stage: 'Final round', sc: 'green', nda: true,  mgmt: true  },
  { name: 'Veritas Capital',    type: 'Sponsor',   bid: '$198M', stage: 'Final round', sc: 'green', nda: true,  mgmt: true  },
  { name: 'Oracle Health',      type: 'Strategic', bid: '$205M', stage: 'Final round', sc: 'green', nda: true,  mgmt: true  },
  { name: 'Blackstone Growth',  type: 'Sponsor',   bid: '$185M', stage: 'Final round', sc: 'green', nda: true,  mgmt: true  },
  { name: 'Amwell',             type: 'Strategic', bid: '$172M', stage: 'LOI pending', sc: 'amber', nda: true,  mgmt: true  },
  { name: 'TA Associates',      type: 'Sponsor',   bid: '$165M', stage: 'IOI in',      sc: 'blue',  nda: true,  mgmt: false },
  { name: 'Epic Systems',       type: 'Strategic', bid: '—',     stage: 'CIM sent',    sc: 'gray',  nda: true,  mgmt: false },
  { name: 'Consonance Capital', type: 'Sponsor',   bid: '—',     stage: 'Passed',      sc: 'red',   nda: true,  mgmt: false },
]

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
}

const avatarColors = ['#0d1f35','#0d2014','#2a1e08','#1a1030','#2a0d0d']
const avatarText   = [c.blue, c.green, c.amber, '#a89cf0', c.red]

export default function SSBuyers() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={panel.wrap}>
        <div style={panel.title}>Buyer universe — Project Falcon</div>
        <div style={{ ...table.row, gridTemplateColumns: '32px 1fr 80px 110px 70px', paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.11)' }}>
          <span /><span style={table.header}>Buyer</span><span style={table.header}>IOI / Bid</span><span style={table.header}>Stage</span><span style={table.header}>NDA · Mgmt</span>
        </div>
        {BUYERS.map((b, i) => {
          const ci = i % avatarColors.length
          return (
            <div key={b.name} style={{ ...table.row, gridTemplateColumns: '32px 1fr 80px 110px 70px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatarColors[ci], color: avatarText[ci], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 500 }}>
                {initials(b.name)}
              </div>
              <div><div style={table.name}>{b.name}</div><div style={table.sub}>{b.type}</div></div>
              <div style={table.mono}>{b.bid}</div>
              <div><span style={pill(b.sc)}>{b.stage}</span></div>
              <div style={{ fontSize: 11 }}>
                <span style={{ color: b.nda  ? c.green : c.text3 }}>✓</span>
                {' · '}
                <span style={{ color: b.mgmt ? c.green : c.text3 }}>{b.mgmt ? '✓' : '–'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
