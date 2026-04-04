import { useState, useRef } from 'react'
import { useMandateContext } from './SellShell'
import { useBuyers } from '../../hooks/useSellSide'
import { c } from './ssStyles'

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

const TABS = [
  { id: 'cim',       label: '📄 CIM' },
  { id: 'voice',     label: '🎤 Voice' },
  { id: 'valuation', label: '💰 Valuation' },
  { id: 'comps',     label: '📊 Comps' },
  { id: 'email',     label: '✉️ Email' },
]

const fmt = (n) => {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  return `$${Math.round(n)}M`
}

export default function SellSidePanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('valuation')
  const { activeMandate, updateMandate, addMandate } = useMandateContext()
  const { buyers } = useBuyers(activeMandate?.id)

  const s = {
    fab: { position:'fixed', bottom:24, right:24, zIndex:1000, width:48, height:48, borderRadius:'50%', background:c.green, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 20px rgba(123,199,94,0.35)`, fontSize:20 },
    panel: { position:'fixed', bottom:84, right:24, zIndex:1000, width:380, maxHeight:'80vh', background:'#141414', border:`0.5px solid rgba(255,255,255,0.11)`, borderRadius:12, display:'flex', flexDirection:'column', boxShadow:'0 8px 40px rgba(0,0,0,0.7)', overflow:'hidden' },
    tabs: { display:'flex', borderBottom:`0.5px solid rgba(255,255,255,0.07)`, overflowX:'auto' },
    tab: (active) => ({ flex:'0 0 auto', padding:'9px 12px', border:'none', background:'transparent', color: active ? c.green : c.text3, cursor:'pointer', fontSize:11, fontWeight: active?600:400, fontFamily:'inherit', borderBottom: active ? `2px solid ${c.green}` : '2px solid transparent', whiteSpace:'nowrap' }),
    body: { flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 },
    label: { fontSize:10, color:c.text3, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4 },
    input: { width:'100%', background:'#1a1a1a', border:`0.5px solid rgba(255,255,255,0.11)`, borderRadius:6, color:'#f0f0f0', fontSize:13, padding:'8px 10px', fontFamily:'inherit', boxSizing:'border-box' },
    btn: (primary) => ({ padding:'7px 14px', borderRadius:6, border: primary ? 'none' : `0.5px solid rgba(255,255,255,0.11)`, background: primary ? c.green : 'transparent', color: primary ? '#0f0f0f' : c.text3, cursor:'pointer', fontSize:12, fontWeight: primary ? 600 : 400, fontFamily:'inherit' }),
    card: { background:'#1a1a1a', border:`0.5px solid rgba(255,255,255,0.07)`, borderRadius:8, padding:'10px 12px' },
  }

  return (
    <>
      <button style={s.fab} onClick={() => setOpen(o => !o)} title="AI Tools">
        {open ? '✕' : '✦'}
      </button>
      {open && (
        <div style={s.panel}>
          <div style={{ padding:'10px 16px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:11, fontWeight:600, color:c.text3, letterSpacing:'0.08em', textTransform:'uppercase' }}>AI Tools</span>
            {activeMandate && <span style={{ fontSize:11, color:c.green }}>{activeMandate.name}</span>}
          </div>
          <div style={s.tabs}>
            {TABS.map(t => <button key={t.id} style={s.tab(tab===t.id)} onClick={()=>setTab(t.id)}>{t.label}</button>)}
          </div>
          <div style={s.body}>
            {!activeMandate && tab !== 'cim' ? (
              <div style={{ color:c.text3, fontSize:13 }}>Select or create a mandate first.</div>
            ) : tab === 'cim' ? <CIMTab s={s} activeMandate={activeMandate} updateMandate={updateMandate} addMandate={addMandate} />
            : tab === 'voice' ? <VoiceTab s={s} activeMandate={activeMandate} updateMandate={updateMandate} />
            : tab === 'valuation' ? <ValuationTab s={s} activeMandate={activeMandate} fmt={fmt} />
            : tab === 'comps' ? <CompsTab s={s} activeMandate={activeMandate} fmt={fmt} />
            : tab === 'email' ? <EmailTab s={s} activeMandate={activeMandate} buyers={buyers} />
            : null}
          </div>
        </div>
      )}
    </>
  )
}

// ── CIM Upload ──────────────────────────────────────────────────────────────
function CIMTab({ s, activeMandate, updateMandate, addMandate }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file || file.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setLoading(true); setError(null); setResult(null)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1]
      try {
        const res = await fetch('/api/sell-parse-cim', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ base64, name: file.name }) })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        setResult(data)
      } catch (err) { setError(err.message) }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  const applyResult = async () => {
    const payload = {
      name: result.name,
      sector: result.sector,
      ev_low: result.ev_low,
      ev_high: result.ev_high,
      stage: result.stage,
      lead_advisor: result.lead_advisor,
      contacts: result.contacts || [],
    }
    if (activeMandate) {
      await updateMandate(activeMandate.id, payload)
    } else {
      await addMandate(payload)
    }
    setResult(null)
  }

  return (
    <>
      <div style={{ fontSize:12, color:c.text2 }}>Upload a CIM to auto-populate mandate details.</div>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
        style={{ border:`1.5px dashed rgba(255,255,255,0.13)`, borderRadius:8, padding:'24px 16px', textAlign:'center', cursor:'pointer', color:c.text3, fontSize:12 }}
      >
        {loading ? 'Parsing CIM...' : '📄 Drop PDF here or click to browse'}
      </div>
      <input ref={fileRef} type="file" accept="application/pdf" style={{display:'none'}} onChange={e=>handleFile(e.target.files[0])} />

      {error && <div style={{ color:c.red, fontSize:12 }}>{error}</div>}

      {result && (
        <div style={s.card}>
          <div style={{ fontSize:13, fontWeight:600, color:c.text1, marginBottom:8 }}>{result.name}</div>
          {[
            ['Sector', result.sector],
            ['EV range', result.ev_low && result.ev_high ? `$${result.ev_low}–${result.ev_high}M` : '—'],
            ['Revenue', result.revenue],
            ['EBITDA', result.ebitda],
            ['Stage', result.stage],
          ].map(([k, v]) => v ? (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
              <span style={{ color:c.text3 }}>{k}</span><span style={{ color:c.text1 }}>{v}</span>
            </div>
          ) : null)}
          {result.business_summary && <div style={{ fontSize:11, color:c.text2, marginTop:8, lineHeight:1.5 }}>{result.business_summary}</div>}
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <button onClick={applyResult} style={s.btn(true)}>{activeMandate ? 'Apply to mandate' : 'Create mandate'}</button>
            <button onClick={()=>setResult(null)} style={s.btn(false)}>Discard</button>
          </div>
        </div>
      )}
    </>
  )
}

// ── Voice ───────────────────────────────────────────────────────────────────
function VoiceTab({ s, activeMandate, updateMandate }) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const recRef = useRef()
  const finalRef = useRef('')

  const start = () => {
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US'
    finalRef.current = ''
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      let interim = '', final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t; else interim += t
      }
      finalRef.current += final
      setTranscript(finalRef.current + interim)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    recRef.current = rec; rec.start()
  }

  const stop = () => recRef.current?.stop()

  const save = async () => {
    if (!transcript.trim() || !activeMandate) return
    setLoading(true)
    await updateMandate(activeMandate.id, { notes: (activeMandate.notes ? activeMandate.notes + '\n\n' : '') + `[Voice note] ${transcript.trim()}` })
    setSaved(true); setTranscript(''); setLoading(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div style={{ fontSize:12, color:c.text2 }}>Speak to add notes to this mandate.</div>
      <button
        onClick={listening ? stop : start}
        style={{ ...s.btn(!listening), background: listening ? 'rgba(240,112,112,0.12)' : c.green, color: listening ? c.red : '#0f0f0f', border: listening ? `0.5px solid ${c.red}` : 'none', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px' }}
      >
        {listening ? '⏹ Stop recording' : '🎤 Start recording'}
        {listening && <span style={{ width:7, height:7, borderRadius:'50%', background:c.red, display:'inline-block', animation:'pulse 1s infinite' }}/>}
      </button>
      {!SpeechRecognition && <div style={{ color:c.amber, fontSize:11 }}>Voice input not supported in this browser.</div>}
      {transcript && (
        <>
          <div style={{ ...s.card, fontSize:13, color:c.text1, lineHeight:1.5 }}>{transcript}</div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={save} disabled={loading} style={s.btn(true)}>{loading ? 'Saving...' : 'Save as note'}</button>
            <button onClick={()=>setTranscript('')} style={s.btn(false)}>Clear</button>
          </div>
        </>
      )}
      {saved && <div style={{ color:c.green, fontSize:12 }}>✓ Saved to mandate notes</div>}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.2}}`}</style>
    </>
  )
}

// ── Valuation ───────────────────────────────────────────────────────────────
function ValuationTab({ s, activeMandate, fmt }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/sell-valuation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mandate: activeMandate }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <>
      <div style={{ fontSize:12, color:c.text2 }}>AI-powered enterprise value estimate for {activeMandate?.name}.</div>
      <button onClick={run} disabled={loading} style={s.btn(true)}>{loading ? 'Analyzing...' : 'Run valuation estimate'}</button>
      {error && <div style={{ color:c.red, fontSize:12 }}>{error}</div>}
      {result && (
        <>
          <div style={s.card}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:10 }}>
              {[['Low', result.ev_low], ['Mid', result.ev_mid], ['High', result.ev_high]].map(([label, val]) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:9, color:c.text3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:16, fontWeight:600, color:label==='Mid'?c.green:c.text1, fontFamily:'DM Mono,monospace' }}>{fmt(val)}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:11, color:c.text2, marginBottom:6 }}><strong style={{color:c.text1}}>{result.primary_method}</strong></div>
            {result.sponsor_range && <div style={{ fontSize:11, color:c.text3, marginBottom:2 }}>Sponsor range: <span style={{color:c.text2}}>{result.sponsor_range}</span></div>}
            {result.strategic_premium && <div style={{ fontSize:11, color:c.text3, marginBottom:8 }}>Strategic premium: <span style={{color:c.green}}>{result.strategic_premium}</span></div>}
            <div style={{ fontSize:11, color:c.text2, lineHeight:1.5, marginBottom:8 }}>{result.rationale}</div>
            {result.key_drivers?.length > 0 && (
              <div style={{ marginBottom:6 }}>
                <div style={{ fontSize:10, color:c.text3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Value drivers</div>
                {result.key_drivers.map((d, i) => <div key={i} style={{ fontSize:11, color:c.text2, marginBottom:2 }}>+ {d}</div>)}
              </div>
            )}
            {result.risks?.length > 0 && (
              <div>
                <div style={{ fontSize:10, color:c.text3, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Risks</div>
                {result.risks.map((r, i) => <div key={i} style={{ fontSize:11, color:c.amber, marginBottom:2 }}>△ {r}</div>)}
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

// ── Comps ───────────────────────────────────────────────────────────────────
function CompsTab({ s, activeMandate, fmt }) {
  const [loading, setLoading] = useState(false)
  const [comps, setComps] = useState(null)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/sell-valuation', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mandate: activeMandate }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setComps(data.comps || [])
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  return (
    <>
      <div style={{ fontSize:12, color:c.text2 }}>Comparable M&A transactions for {activeMandate?.name}.</div>
      <button onClick={run} disabled={loading} style={s.btn(true)}>{loading ? 'Fetching comps...' : 'Pull comparable transactions'}</button>
      {error && <div style={{ color:c.red, fontSize:12 }}>{error}</div>}
      {comps && comps.map((comp, i) => (
        <div key={i} style={s.card}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontSize:13, fontWeight:600, color:c.text1 }}>{comp.target}</span>
            <span style={{ fontSize:11, color:c.text3 }}>{comp.date}</span>
          </div>
          <div style={{ fontSize:11, color:c.text3, marginBottom:4 }}>Acquirer: <span style={{color:c.text2}}>{comp.acquirer}</span></div>
          <div style={{ display:'flex', gap:12, marginBottom:6 }}>
            <span style={{ fontSize:12, fontFamily:'DM Mono,monospace', color:c.green }}>{comp.ev}</span>
            <span style={{ fontSize:12, color:c.blue }}>{comp.multiple}</span>
          </div>
          <div style={{ fontSize:11, color:c.text3, lineHeight:1.4 }}>{comp.notes}</div>
        </div>
      ))}
    </>
  )
}

// ── Email ───────────────────────────────────────────────────────────────────
function EmailTab({ s, activeMandate, buyers }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [selectedBuyer, setSelectedBuyer] = useState('')
  const [copied, setCopied] = useState(false)

  const run = async () => {
    setLoading(true); setError(null)
    const buyer = buyers.find(b => b.id === selectedBuyer) || null
    try {
      const res = await fetch('/api/sell-email', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mandate: activeMandate, buyer }) })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch (err) { setError(err.message) }
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div style={{ fontSize:12, color:c.text2 }}>Generate a buyer outreach email for {activeMandate?.name}.</div>
      {buyers.length > 0 && (
        <div>
          <div style={s.label}>Target buyer (optional)</div>
          <select value={selectedBuyer} onChange={e=>setSelectedBuyer(e.target.value)}
            style={{...s.input, color: selectedBuyer ? '#f0f0f0' : c.text3}}>
            <option value="">Generic outreach</option>
            {buyers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      <button onClick={run} disabled={loading} style={s.btn(true)}>{loading ? 'Generating...' : 'Generate email'}</button>
      {error && <div style={{ color:c.red, fontSize:12 }}>{error}</div>}
      {result && (
        <div style={s.card}>
          <div style={{ fontSize:11, color:c.text3, marginBottom:4 }}>Subject</div>
          <div style={{ fontSize:12, fontWeight:600, color:c.text1, marginBottom:10 }}>{result.subject}</div>
          <div style={{ fontSize:11, color:c.text3, marginBottom:4 }}>Body</div>
          <div style={{ fontSize:12, color:c.text2, lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:200, overflowY:'auto' }}>{result.body}</div>
          <button onClick={copy} style={{ ...s.btn(true), marginTop:10 }}>{copied ? '✓ Copied!' : 'Copy to clipboard'}</button>
        </div>
      )}
    </>
  )
}
