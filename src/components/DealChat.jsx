import { useState, useRef, useEffect } from 'react'

const fmt = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${n.toLocaleString()}`

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function DealChat({ onCreateDeal }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [created, setCreated] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceSupported] = useState(() => !!SpeechRecognition)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Clean up recognition on unmount
  useEffect(() => () => recognitionRef.current?.abort(), [])

  const startListening = () => {
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    finalTranscriptRef.current = ''

    rec.onstart = () => setListening(true)

    rec.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      finalTranscriptRef.current += final
      setInput(finalTranscriptRef.current + interim)
    }

    rec.onerror = (e) => {
      console.error('Speech error:', e.error)
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      // Auto-parse if we captured something
      if (finalTranscriptRef.current.trim()) {
        setInput(finalTranscriptRef.current.trim())
        setTimeout(() => handleSendText(finalTranscriptRef.current.trim()), 100)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
  }

  const handleSendText = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setLoading(true)
    setPreview(null)
    setCreated(false)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      setPreview(data)
    } catch {
      setPreview({ error: 'Network error. Try again.' })
    }
    setLoading(false)
  }

  const handleSend = () => handleSendText(input)

  const handleConfirm = async () => {
    if (!preview || preview.error) return
    try {
      await onCreateDeal(preview)
      setCreated(true)
      setInput('')
      setPreview(null)
      setTimeout(() => setCreated(false), 2000)
    } catch (e) {
      setPreview({ error: 'Failed to create deal: ' + e.message })
    }
  }

  const s = {
    fab: {
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      width: 48, height: 48, borderRadius: '50%',
      background: '#7c6af7', border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 20px rgba(124,106,247,0.4)',
      fontSize: 20,
    },
    panel: {
      position: 'fixed', bottom: 84, right: 24, zIndex: 1000,
      width: 340, background: '#111', border: '1px solid #222',
      borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    },
    label: { color: '#888', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
    textarea: {
      background: '#1a1a1a', border: `1px solid ${listening ? '#7c6af7' : '#333'}`, borderRadius: 8,
      color: '#e5e5e5', fontSize: 13, padding: '10px 12px',
      resize: 'none', fontFamily: 'inherit', outline: 'none', width: '100%',
      boxSizing: 'border-box', transition: 'border-color 0.2s',
    },
    btn: (primary) => ({
      background: primary ? '#7c6af7' : '#1a1a1a',
      border: primary ? 'none' : '1px solid #333',
      color: primary ? '#fff' : '#aaa',
      borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
      fontSize: 13, fontWeight: primary ? 600 : 400,
    }),
    micBtn: {
      background: listening ? 'rgba(248,113,113,0.15)' : '#1a1a1a',
      border: `1px solid ${listening ? '#f87171' : '#333'}`,
      color: listening ? '#f87171' : '#888',
      borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
      fontSize: 16, display: 'flex', alignItems: 'center', gap: 6,
      transition: 'all 0.2s', flexShrink: 0,
    },
    preview: {
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: 8, padding: 12, fontSize: 12, color: '#ccc',
    },
    row: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
    key: { color: '#555' },
    val: { color: '#e5e5e5', fontWeight: 500 },
  }

  return (
    <>
      <button style={s.fab} onClick={() => setOpen(o => !o)} title="AI Deal Entry">
        {open ? '✕' : '✦'}
      </button>

      {open && (
        <div style={s.panel} className="chat-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={s.label}>AI Deal Entry</span>
            {listening && (
              <span style={{ color: '#f87171', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#f87171',
                  display: 'inline-block',
                  animation: 'pulse 1s infinite',
                }} />
                Listening…
              </span>
            )}
          </div>

          <textarea
            ref={inputRef}
            style={s.textarea}
            rows={3}
            placeholder={listening ? 'Speak now…' : 'e.g. "Acme Corp raising $5M, tech sector, in diligence"'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSend} disabled={loading} style={{ ...s.btn(true), flex: 1 }}>
              {loading ? 'Parsing...' : 'Parse Deal →'}
            </button>

            {voiceSupported && (
              <button
                style={s.micBtn}
                onClick={listening ? stopListening : startListening}
                title={listening ? 'Stop recording' : 'Speak a deal'}
              >
                {listening ? '⏹' : '🎤'}
              </button>
            )}
          </div>

          {preview && !preview.error && (
            <div style={s.preview}>
              <div style={{ ...s.row, marginBottom: 8 }}>
                <span style={{ color: '#e5e5e5', fontWeight: 600, fontSize: 13 }}>{preview.company_name}</span>
                <span style={{ color: '#9d8fff', fontSize: 11 }}>{preview.stage}</span>
              </div>
              {preview.raise_amount && <div style={s.row}><span style={s.key}>Raise</span><span style={s.val}>{fmt(preview.raise_amount)}</span></div>}
              {preview.valuation && <div style={s.row}><span style={s.key}>Valuation</span><span style={s.val}>{fmt(preview.valuation)}</span></div>}
              {preview.sector && <div style={s.row}><span style={s.key}>Sector</span><span style={s.val}>{preview.sector}</span></div>}
              {preview.deal_owner && <div style={s.row}><span style={s.key}>Owner</span><span style={s.val}>{preview.deal_owner}</span></div>}
              {preview.notes && <div style={{ color: '#666', marginTop: 4 }}>{preview.notes}</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={s.btn(true)} onClick={handleConfirm}>Create Deal</button>
                <button style={s.btn(false)} onClick={() => setPreview(null)}>Edit</button>
              </div>
            </div>
          )}

          {preview?.error && (
            <div style={{ color: '#f87171', fontSize: 12 }}>{preview.error}</div>
          )}

          {created && (
            <div style={{ color: '#4ade80', fontSize: 12 }}>✓ Deal created!</div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </>
  )
}
