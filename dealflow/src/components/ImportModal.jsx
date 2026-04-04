import { useState, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

const STAGES = ['Sourced', 'Investor Targeting', 'Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed']
const SECTORS = ['Technology', 'Gaming', 'Media & Entertainment', 'Hospitality', 'Sports', 'Healthcare', 'Consumer', 'Finance', 'Real Estate', 'Other']

const fmt = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n ? `$${Number(n).toLocaleString()}` : '—'

// ── Column auto-mapping for Excel ──────────────────────────────────────────
const COL_MAP = {
  company_name: [
    'company', 'company name', 'company_name', 'companyname',
    'name', 'business', 'business name',
    'deal', 'deal name', 'deal_name', 'dealname',
    'target', 'target company', 'target name',
    'portfolio', 'portfolio company', 'portfolio co',
    'issuer', 'borrower', 'entity', 'account',
    'organization', 'org', 'firm',
  ],
  stage: ['stage', 'status', 'deal stage', 'pipeline stage', 'deal status', 'phase', 'current stage'],
  raise_amount: [
    'raise', 'raise amount', 'raising', 'deal size', 'amount',
    'investment size', 'round size', 'funding amount', 'capital raise',
    'transaction size', 'check size', 'investment amount', 'size',
  ],
  valuation: [
    'valuation', 'val', 'post money', 'pre money',
    'post-money', 'pre-money', 'enterprise value', 'ev',
    'implied valuation', 'equity value',
  ],
  sector: ['sector', 'industry', 'vertical', 'space', 'category', 'market', 'segment'],
  deal_owner: [
    'owner', 'deal owner', 'source', 'sourced by', 'contact',
    'assigned to', 'analyst', 'associate', 'banker', 'coverage',
    'lead', 'relationship', 'rm',
  ],
  website: ['website', 'url', 'web', 'domain', 'site', 'link', 'homepage'],
  notes: ['notes', 'description', 'summary', 'memo', 'comments', 'overview', 'details', 'narrative'],
}

function cleanHeader(h) {
  return h.replace(/^\uFEFF/, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').toLowerCase().trim()
}

function mapHeaders(headers) {
  // Score-based matching: exact match (100) > full-word substring for aliases ≥5 chars (10)
  // Short aliases (≤4 chars) only match exactly to avoid false positives
  const scores = {} // { field: { header, score } }

  headers.forEach(h => {
    const lower = cleanHeader(h)
    for (const [field, aliases] of Object.entries(COL_MAP)) {
      let best = 0
      for (const a of aliases) {
        if (lower === a) { best = Math.max(best, 100); break }
        if (a.length >= 5 && (lower.includes(a) || a.includes(lower))) best = Math.max(best, 10)
      }
      if (best > 0 && (!scores[field] || best > scores[field].score)) {
        scores[field] = { header: h, score: best }
      }
    }
  })

  const result = {}
  for (const [field, { header }] of Object.entries(scores)) result[field] = header

  // Fallback: use first column for company_name
  if (!result.company_name && headers.length > 0) result.company_name = headers[0]

  return result
}

function parseMoney(val) {
  if (!val && val !== 0) return null
  const s = val.toString().replace(/[$,\s]/g, '').toLowerCase()
  const num = parseFloat(s)
  if (isNaN(num)) return null
  if (s.endsWith('b')) return num * 1e9
  if (s.endsWith('m') || s.endsWith('mm')) return num * 1e6
  if (s.endsWith('k')) return num * 1e3
  return num
}

function parseStage(val) {
  if (!val) return 'Sourced'
  const v = val.toString().toLowerCase()
  return STAGES.find(s => s.toLowerCase() === v || s.toLowerCase().includes(v) || v.includes(s.toLowerCase())) || 'Sourced'
}

function parseSector(val) {
  if (!val) return null
  const v = val.toString().toLowerCase()
  return SECTORS.find(s => s.toLowerCase() === v || s.toLowerCase().includes(v) || v.includes(s.toLowerCase())) || 'Other'
}

// ── Styles ─────────────────────────────────────────────────────────────────
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }
const modal = { background: '#111', border: '1px solid #222', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
const hdr = { padding: '20px 24px 0', borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }
const body = { padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }
const ftr = { padding: '16px 24px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 10, justifyContent: 'flex-end' }
const inp = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 7, color: '#e5e5e5', fontSize: 12, padding: '8px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btn = (v) => ({ background: v === 'primary' ? '#7c6af7' : v === 'danger' ? 'rgba(248,113,113,0.1)' : '#1a1a1a', border: v === 'primary' ? 'none' : v === 'danger' ? '1px solid #991b1b' : '1px solid #2a2a2a', color: v === 'primary' ? '#fff' : v === 'danger' ? '#f87171' : '#aaa', borderRadius: 7, padding: '8px 18px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: v === 'primary' ? 600 : 400 })
const tab = (active) => ({ background: active ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: 6, color: active ? '#f0f0f0' : '#555', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: '5px 14px', letterSpacing: '0.04em' })
const previewCard = { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: 14, fontSize: 12 }
const row = { display: 'flex', justifyContent: 'space-between', marginBottom: 5 }
const dropZone = (drag) => ({ border: `2px dashed ${drag ? '#7c6af7' : '#2a2a2a'}`, borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer', background: drag ? 'rgba(124,106,247,0.05)' : 'transparent', transition: 'all 0.15s' })

// ── DealPreview ─────────────────────────────────────────────────────────────
function DealPreview({ deal }) {
  const metricEntries = deal.metrics ? Object.entries(deal.metrics).filter(([, v]) => v) : []
  return (
    <div style={previewCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>{deal.company_name}</span>
        <span style={{ color: '#9d8fff', fontSize: 11 }}>{deal.stage}</span>
      </div>
      {deal.raise_amount && <div style={row}><span style={{ color: '#555' }}>Raise</span><span style={{ color: '#e5e5e5' }}>{fmt(deal.raise_amount)}</span></div>}
      {deal.valuation && <div style={row}><span style={{ color: '#555' }}>Valuation</span><span style={{ color: '#e5e5e5' }}>{fmt(deal.valuation)}</span></div>}
      {deal.sector && <div style={row}><span style={{ color: '#555' }}>Sector</span><span style={{ color: '#e5e5e5' }}>{deal.sector}</span></div>}
      {deal.deal_owner && <div style={row}><span style={{ color: '#555' }}>Advisor</span><span style={{ color: '#e5e5e5' }}>{deal.deal_owner}</span></div>}

      {/* Metrics */}
      {metricEntries.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #222' }}>
          <div style={{ color: '#444', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Financials</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px' }}>
            {metricEntries.map(([k, v]) => (
              <div key={k} style={{ fontSize: 11 }}>
                <span style={{ color: '#555' }}>{k.replace(/_/g, ' ')}: </span>
                <span style={{ color: '#ccc' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts */}
      {deal.contacts?.length > 0 && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #222' }}>
          <div style={{ color: '#444', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Management</div>
          {deal.contacts.map((c, i) => (
            <div key={i} style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>
              <span style={{ color: '#ccc' }}>{c.name}</span>
              {c.firm && <span style={{ color: '#555' }}> · {c.firm}</span>}
            </div>
          ))}
        </div>
      )}

      {deal.notes && <div style={{ color: '#666', marginTop: 10, paddingTop: 10, borderTop: '1px solid #222', lineHeight: 1.5, fontSize: 12 }}>{deal.notes}</div>}
    </div>
  )
}

// ── CIM Tab ─────────────────────────────────────────────────────────────────
function CIMTab({ onDealReady }) {
  const { user } = useUser()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [deal, setDeal] = useState(null)
  const [docUrl, setDocUrl] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const handleFile = async (f) => {
    if (!f || f.type !== 'application/pdf') { setError('Please upload a PDF file.'); return }
    setFile(f); setError(''); setDeal(null)
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    handleFile(f)
  }

  const parseCIM = async () => {
    if (!file) return
    setUploading(true); setError('')

    // 1. Upload to Supabase Storage
    const path = `cim-uploads/${user.id}/${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('deal-files').upload(path, file)
    if (upErr) { setError('Upload failed: ' + upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('deal-files').getPublicUrl(path)
    setDocUrl(publicUrl)
    setUploading(false); setParsing(true)

    // 2. Parse via API
    try {
      const res = await fetch('/api/parse-cim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: publicUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDeal(data)
    } catch (e) {
      setError('Parsing failed: ' + e.message)
    }
    setParsing(false)
  }

  const handleConfirm = () => {
    if (!deal) return
    const doc = docUrl ? [{
      id: crypto.randomUUID(),
      name: file.name,
      url: docUrl,
      size: file.size,
      type: 'application/pdf',
      uploaded_at: new Date().toISOString(),
    }] : []
    onDealReady({ ...deal, documents: doc })
  }

  const busy = uploading || parsing

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={dropZone(dragging)}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
        <div style={{ color: '#888', fontSize: 13 }}>{file ? file.name : 'Drop your CIM here or click to browse'}</div>
        {file && <div style={{ color: '#555', fontSize: 11, marginTop: 4 }}>{(file.size / 1e6).toFixed(1)} MB · PDF</div>}
        <input ref={fileRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      </div>

      {file && !deal && (
        <button style={btn('primary')} onClick={parseCIM} disabled={busy}>
          {uploading ? 'Uploading…' : parsing ? 'Reading CIM with AI…' : '✦ Parse CIM'}
        </button>
      )}

      {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}

      {deal && (
        <>
          <div style={{ color: '#4ade80', fontSize: 11 }}>✓ CIM parsed — review and confirm</div>
          <DealPreview deal={deal} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('primary')} onClick={handleConfirm}>Create Deal</button>
            <button style={btn()} onClick={() => { setDeal(null); setFile(null); setDocUrl(null) }}>Try Another</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Excel Tab ────────────────────────────────────────────────────────────────
const FIELD_LABELS = {
  company_name: 'Company Name *',
  stage: 'Stage',
  raise_amount: 'Raise Amount',
  valuation: 'Valuation',
  sector: 'Sector',
  deal_owner: 'Deal Owner',
  website: 'Website',
  notes: 'Notes',
}

function buildDeals(raw, mapping) {
  return raw
    .filter(r => r[mapping.company_name]?.toString().trim())
    .map(r => ({
      company_name: r[mapping.company_name]?.toString().trim(),
      stage: mapping.stage ? parseStage(r[mapping.stage]) : 'Sourced',
      raise_amount: mapping.raise_amount ? parseMoney(r[mapping.raise_amount]) : null,
      valuation: mapping.valuation ? parseMoney(r[mapping.valuation]) : null,
      sector: mapping.sector ? parseSector(r[mapping.sector]) : null,
      deal_owner: mapping.deal_owner ? r[mapping.deal_owner]?.toString().trim() || null : null,
      website: mapping.website ? r[mapping.website]?.toString().trim() || null : null,
      notes: mapping.notes ? r[mapping.notes]?.toString().trim() || null : null,
    }))
}

function ExcelTab({ onDealsReady }) {
  const [dragging, setDragging] = useState(false)
  const [rawData, setRawData] = useState(null)   // raw rows from xlsx
  const [headers, setHeaders] = useState([])
  const [mapping, setMapping] = useState({})      // field → header column name
  const [deals, setDeals] = useState(null)        // built deals after confirming mapping
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const parseFile = (f) => {
    if (!f) return
    setError(''); setRawData(null); setDeals(null); setMapping({})
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (!raw.length) { setError('No data found in spreadsheet.'); return }
        const hdrs = Object.keys(raw[0])
        const autoMap = mapHeaders(hdrs)
        setHeaders(hdrs)
        setRawData(raw)
        setMapping(autoMap)
      } catch (err) {
        setError('Could not parse file: ' + err.message)
      }
    }
    reader.readAsBinaryString(f)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); parseFile(e.dataTransfer.files[0]) }

  const confirmMapping = () => {
    if (!mapping.company_name) { setError('Please map the Company Name column.'); return }
    setDeals(buildDeals(rawData, mapping))
  }

  const selStyle = { ...inp, width: 'auto', flex: 1, cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Drop zone — only shown before file loaded */}
      {!rawData && (
        <div
          style={dropZone(dragging)}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ color: '#888', fontSize: 13 }}>Drop your Excel or CSV here, or click to browse</div>
          <div style={{ color: '#444', fontSize: 11, marginTop: 4 }}>.xlsx · .xls · .csv</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => parseFile(e.target.files[0])} />
        </div>
      )}

      {error && <div style={{ color: '#f87171', fontSize: 12 }}>{error}</div>}

      {/* Column mapper */}
      {rawData && !deals && (
        <>
          <div style={{ color: '#888', fontSize: 12 }}>
            {rawData.length} rows detected — map your columns:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(FIELD_LABELS).map(field => (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: field === 'company_name' ? '#c4b5fd' : '#666', fontSize: 11, width: 120, flexShrink: 0, fontFamily: 'DM Mono, monospace' }}>
                  {FIELD_LABELS[field]}
                </span>
                <select
                  value={mapping[field] || ''}
                  onChange={e => setMapping(m => ({ ...m, [field]: e.target.value || undefined }))}
                  style={selStyle}
                >
                  <option value="">— skip —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('primary')} onClick={confirmMapping}>Preview Import →</button>
            <button style={btn()} onClick={() => { setRawData(null); setDeals(null) }}>Change File</button>
          </div>
        </>
      )}

      {/* Deal preview after mapping confirmed */}
      {deals && (
        <>
          <div style={{ color: '#4ade80', fontSize: 12 }}>✓ {deals.length} deal{deals.length !== 1 ? 's' : ''} ready to import</div>
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {deals.map((d, i) => (
              <div key={i} style={{ ...previewCard, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ color: '#f0f0f0', fontWeight: 600, fontFamily: 'Syne, sans-serif', fontSize: 13 }}>{d.company_name}</span>
                  {d.sector && <span style={{ color: '#555', fontSize: 11, marginLeft: 8 }}>{d.sector}</span>}
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#666' }}>
                  {d.raise_amount && <span>{fmt(d.raise_amount)}</span>}
                  <span style={{ color: '#555' }}>{d.stage}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={btn('primary')} onClick={() => onDealsReady(deals)}>
              Import {deals.length} Deal{deals.length !== 1 ? 's' : ''}
            </button>
            <button style={btn()} onClick={() => setDeals(null)}>← Adjust Mapping</button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function ImportModal({ onClose, addDeal }) {
  const [activeTab, setActiveTab] = useState('cim')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState('')

  const handleDealReady = async (deal) => {
    setImporting(true)
    try {
      await addDeal(deal)
      setDone('Deal created!')
      setTimeout(onClose, 1200)
    } catch (e) {
      alert('Failed to create deal: ' + e.message)
    }
    setImporting(false)
  }

  const handleDealsReady = async (deals) => {
    setImporting(true)
    try {
      for (const deal of deals) await addDeal(deal)
      setDone(`${deals.length} deals imported!`)
      setTimeout(onClose, 1400)
    } catch (e) {
      alert('Import failed: ' + e.message)
    }
    setImporting(false)
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modal}>
        <div style={hdr}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 2 }}>Import Deals</div>
              <div style={{ color: '#555', fontSize: 12 }}>Upload a CIM to create a deal, or import a spreadsheet of deals</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, padding: '2px 6px', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['cim', '📄 CIM (PDF)'], ['excel', '📊 Excel / CSV']].map(([k, label]) => (
              <button key={k} style={tab(activeTab === k)} onClick={() => setActiveTab(k)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={body}>
          {done ? (
            <div style={{ color: '#4ade80', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>✓ {done}</div>
          ) : importing ? (
            <div style={{ color: '#888', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Importing…</div>
          ) : activeTab === 'cim' ? (
            <CIMTab onDealReady={handleDealReady} />
          ) : (
            <ExcelTab onDealsReady={handleDealsReady} />
          )}
        </div>
      </div>
    </div>
  )
}
