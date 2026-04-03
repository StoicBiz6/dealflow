import { panel, table, c } from '../../components/sell-side/ssStyles'

const DOCS = [
  { name: 'Financial model (LTM)',      folder: 'Financials', views: 38, buyers: 5 },
  { name: 'Revenue bridge FY23–25',     folder: 'Financials', views: 31, buyers: 5 },
  { name: 'Customer cohort analysis',   folder: 'Commercial', views: 27, buyers: 4 },
  { name: 'Tech architecture overview', folder: 'Technology', views: 24, buyers: 4 },
  { name: 'Quality of earnings report', folder: 'Diligence',  views: 19, buyers: 3 },
  { name: 'Management bios',            folder: 'Management', views: 16, buyers: 4 },
  { name: 'IP & patents schedule',      folder: 'Legal',      views: 11, buyers: 2 },
  { name: 'Draft SPA',                  folder: 'Legal',      views: 7,  buyers: 2 },
]

const ENGAGEMENT = [
  { name: 'KKR',               docs: 142, pct: 100 },
  { name: 'Veritas Capital',   docs: 118, pct: 83  },
  { name: 'Oracle Health',     docs: 97,  pct: 68  },
  { name: 'Blackstone Growth', docs: 84,  pct: 59  },
  { name: 'Amwell',            docs: 51,  pct: 36  },
  { name: 'TA Associates',     docs: 29,  pct: 20  },
]

export default function SSDataRoom() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 14 }}>
        <div style={panel.wrap}>
          <div style={panel.title}>Document activity</div>
          <div style={{ ...table.row, gridTemplateColumns: '1fr 80px 60px 70px', paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.11)' }}>
            {['Document','Folder','Views','Buyers'].map(h => <span key={h} style={table.header}>{h}</span>)}
          </div>
          {DOCS.map((d, i) => (
            <div key={d.name} style={{ ...table.row, gridTemplateColumns: '1fr 80px 60px 70px', borderBottom: i < DOCS.length - 1 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: c.text1 }}>{d.name}</div>
              <div style={{ fontSize: 11, color: c.text3 }}>{d.folder}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.text1, fontFamily: 'DM Mono, monospace' }}>{d.views}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: c.text1, fontFamily: 'DM Mono, monospace' }}>{d.buyers}</div>
            </div>
          ))}
        </div>

        <div style={panel.wrap}>
          <div style={panel.title}>Buyer engagement</div>
          {ENGAGEMENT.map(e => (
            <div key={e.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: c.text1 }}>{e.name}</span>
                <span style={{ fontSize: 12, color: c.text2, fontFamily: 'DM Mono, monospace' }}>{e.docs} docs</span>
              </div>
              <div style={{ height: 4, background: c.raised, borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${e.pct}%`, background: c.blue, opacity: 0.7, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
