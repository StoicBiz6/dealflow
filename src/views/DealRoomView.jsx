import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'
import { STAGE_COLORS } from '../lib/constants'
import { formatCurrency, formatDate } from '../lib/utils'

const card = { background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '20px', marginBottom: '12px' }
const sectionLabel = { fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px', display: 'block' }
const metaKey = { color: '#555', fontSize: '12px' }
const metaVal = { color: '#ccc', fontSize: '12px', fontWeight: 500 }

const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#f0f0f0', fontSize: '13px', fontFamily: 'DM Mono, monospace', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btnStyle = (disabled) => ({ background: '#7c6af7', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'DM Mono, monospace', width: '100%' })

export default function DealRoomView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()

  // ── Clerk-authenticated user state ──────────────────────────────────────────
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // ── Guest (OTP) state ────────────────────────────────────────────────────────
  const [guestDeal, setGuestDeal] = useState(null)
  const [guestEmail, setGuestEmail] = useState('')
  const [otpStep, setOtpStep] = useState('email') // 'email' | 'code'
  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [otpSubmitting, setOtpSubmitting] = useState(false)

  // ── Shared ───────────────────────────────────────────────────────────────────
  const [viewingDoc, setViewingDoc] = useState(null) // { name, viewUrl }

  // Block keyboard download shortcuts inside the doc viewer
  const handleKeyDown = useCallback((e) => {
    if (!viewingDoc) return
    if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'a'].includes(e.key.toLowerCase())) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, [viewingDoc])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  // ── Load deal for Clerk-authenticated users ──────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      // Not signed in — will show OTP gate below
      setLoading(false)
      return
    }

    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('deals').select('*').eq('id', id).single()
      if (error || !data) {
        setLoading(false)
        setAuthChecked(true)
        return
      }

      const userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
      const sharedWith = data.shared_with || []
      const isOwner = data.user_id === user.id
      const isShared = sharedWith.some(e => e.toLowerCase() === userEmail)

      let isWorkspaceMember = false
      if (data.workspace_id) {
        const { data: member } = await supabase
          .from('workspace_members')
          .select('user_id')
          .eq('workspace_id', data.workspace_id)
          .eq('user_id', user.id)
          .single()
        isWorkspaceMember = !!member
      }

      if (isOwner || isShared || isWorkspaceMember) {
        setDeal(data)
        setAuthorized(true)
        if (isShared) {
          fetch('/api/deal-room-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'notify', dealId: id, viewerEmail: userEmail }),
          }).catch(() => {})
        }
      } else {
        setAuthorized(false)
      }

      setLoading(false)
      setAuthChecked(true)
    }

    load()
  }, [id, user, isLoaded])

  // ── OTP handlers (guest flow) ────────────────────────────────────────────────
  const handleOtpEmailSubmit = async (e) => {
    e.preventDefault()
    if (otpSubmitting) return
    setOtpSubmitting(true)
    setOtpError('')
    try {
      const res = await fetch('/api/deal-room-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', dealId: id, email: otpEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error || 'Failed to send code. Please try again.')
      } else {
        setOtpStep('code')
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpSubmitting(false)
    }
  }

  const handleOtpCodeSubmit = async (e) => {
    e.preventDefault()
    if (otpSubmitting) return
    setOtpSubmitting(true)
    setOtpError('')
    try {
      const res = await fetch('/api/deal-room-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', dealId: id, email: otpEmail.trim().toLowerCase(), code: otpCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setOtpError(data.error || 'Invalid code. Please try again.')
      } else {
        setGuestDeal(data.deal)
        setGuestEmail(data.viewerEmail)
      }
    } catch {
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpSubmitting(false)
    }
  }

  // ── Render: loading ──────────────────────────────────────────────────────────
  if (!isLoaded || (user && loading)) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
        Loading…
      </div>
    )
  }

  // ── Render: OTP gate for guests ──────────────────────────────────────────────
  if (!user && !guestDeal) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', fontFamily: 'DM Mono, monospace', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#f0f0f0', marginBottom: '10px' }}>🔒 Deal Room Access</div>
          <div style={{ color: '#555', fontSize: '13px', lineHeight: 1.6, maxWidth: '360px' }}>
            {otpStep === 'email'
              ? 'Enter the email address you were invited with to receive an access code.'
              : `A 6-digit code was sent to ${otpEmail}. Enter it below to view the deal room.`}
          </div>
        </div>

        <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '28px 32px', width: '100%', maxWidth: '360px' }}>
          {otpStep === 'email' ? (
            <form onSubmit={handleOtpEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="email"
                value={otpEmail}
                onChange={e => setOtpEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                required
                style={inputStyle}
              />
              {otpError && <div style={{ color: '#f87171', fontSize: '12px' }}>{otpError}</div>}
              <button type="submit" disabled={otpSubmitting || !otpEmail} style={btnStyle(otpSubmitting || !otpEmail)}>
                {otpSubmitting ? 'Sending…' : 'Send code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                inputMode="numeric"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                required
                style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: '20px' }}
              />
              {otpError && <div style={{ color: '#f87171', fontSize: '12px' }}>{otpError}</div>}
              <button type="submit" disabled={otpSubmitting || otpCode.length < 6} style={btnStyle(otpSubmitting || otpCode.length < 6)}>
                {otpSubmitting ? 'Verifying…' : 'Access deal room →'}
              </button>
              <button
                type="button"
                onClick={() => { setOtpStep('email'); setOtpCode(''); setOtpError('') }}
                style={{ background: 'none', border: 'none', color: '#444', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', marginTop: '4px' }}
              >
                ← Use a different email
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ── Render: access denied (Clerk user not authorized) ───────────────────────
  if (user && authChecked && !authorized) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔒</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#f0f0f0', marginBottom: '10px' }}>
            Access Denied
          </div>
          <div style={{ color: '#555', fontSize: '13px', lineHeight: 1.6, marginBottom: '24px' }}>
            You don't have access to this deal room. Contact the deal owner to request access.
          </div>
          <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px 16px', color: '#444', fontSize: '11px', fontFamily: 'DM Mono, monospace', wordBreak: 'break-all' }}>
            Signed in as: {user?.emailAddresses?.[0]?.emailAddress}
          </div>
        </div>
      </div>
    )
  }

  // ── Resolve active deal & viewer email ──────────────────────────────────────
  const activeDeal = user ? deal : guestDeal
  const viewerEmail = user
    ? (user.emailAddresses?.[0]?.emailAddress?.toLowerCase() || '')
    : guestEmail

  if (!activeDeal) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
        Deal not found.
      </div>
    )
  }

  const colors = STAGE_COLORS[activeDeal.stage] || STAGE_COLORS['Sourced']
  const metrics = activeDeal.metrics || {}
  const allDocuments = activeDeal.documents || []
  const documents = activeDeal.shared_docs
    ? allDocuments.filter(d => activeDeal.shared_docs.includes(d.url))
    : allDocuments
  const coInvestors = activeDeal.co_investors || []

  // Watermark with the invited email
  const sharedEmails = activeDeal.shared_with || []
  const watermarkEmail = sharedEmails.find(e => e.toLowerCase() === viewerEmail) || sharedEmails[0] || viewerEmail

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'DM Mono, monospace' }}>
      {/* Nav */}
      <nav style={{ height: '52px', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 40 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: '#f0f0f0', flex: 1 }}>
          {activeDeal.company_name}
        </span>
        <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', color: '#555', fontSize: '11px' }}>
          Read-only · Deal Room
        </span>
        <span style={{ color: '#333', fontSize: '11px' }}>
          Viewing as {viewerEmail}
        </span>
      </nav>

      {/* Content */}
      <div style={{ padding: '28px 32px 40px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#f0f0f0', margin: 0 }}>
            {activeDeal.company_name}
          </h1>
          <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '5px', padding: '3px 12px', fontSize: '11px' }}>
            {activeDeal.stage}
          </span>
          {activeDeal.sector && <span style={{ color: '#555', fontSize: '12px' }}>{activeDeal.sector}</span>}
          {activeDeal.raise_amount && (
            <span style={{ color: '#888', fontSize: '13px', marginLeft: 'auto' }}>
              {formatCurrency(activeDeal.raise_amount)} raise
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px' }}>
          {/* Left */}
          <div>

            {/* Investment Memo */}
            {activeDeal.memo && (
              <div style={card}>
                <span style={sectionLabel}>Investment Overview</span>
                <div style={{ color: '#bbb', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {activeDeal.memo}
                </div>
              </div>
            )}

            {/* Key Metrics */}
            {Object.keys(metrics).some(k => metrics[k]) && (
              <div style={card}>
                <span style={sectionLabel}>Key Metrics</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {[
                    { key: 'revenue', label: 'Revenue' },
                    { key: 'ebitda', label: 'EBITDA' },
                    { key: 'growth_rate', label: 'Growth Rate' },
                    { key: 'burn_rate', label: 'Burn Rate / mo' },
                  ].filter(({ key }) => metrics[key]).map(({ key, label }) => (
                    <div key={key}>
                      <div style={{ color: '#444', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ color: '#e5e5e5', fontSize: '13px', fontWeight: 500 }}>{metrics[key]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents — view-only, watermarked */}
            {documents.length > 0 && (
              <div style={card}>
                <span style={sectionLabel}>Documents</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {documents.map((doc, i) => {
                    const viewUrl = `/api/view-doc?url=${encodeURIComponent(doc.url)}&email=${encodeURIComponent(watermarkEmail)}`
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < documents.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                        <span style={{ fontSize: '16px' }}>{doc.type?.includes('pdf') ? '📄' : doc.type?.includes('image') ? '🖼️' : '📎'}</span>
                        <span style={{ flex: 1, color: '#ccc', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</span>
                        <button
                          onClick={() => setViewingDoc({ name: doc.name, viewUrl })}
                          style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0', color: '#9d8fff', fontSize: '11px', padding: '4px 12px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                        >
                          View
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Right */}
          <div>

            {/* Deal Summary */}
            <div style={card}>
              <span style={sectionLabel}>Deal Summary</span>
              {[
                { label: 'Raise', value: formatCurrency(activeDeal.raise_amount) },
                { label: 'Valuation', value: formatCurrency(activeDeal.valuation) },
                { label: 'Sector', value: activeDeal.sector },
                { label: 'Stage', value: activeDeal.stage },
                { label: 'Deal Owner', value: activeDeal.deal_owner },
                (activeDeal.expected_close_date || activeDeal.timeline_to_close) && { label: 'Timeline', value: formatDate(activeDeal.expected_close_date || activeDeal.timeline_to_close) },
              ].filter(r => r && r.value && r.value !== '—').map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={metaKey}>{r.label}</span>
                  <span style={metaVal}>{r.value}</span>
                </div>
              ))}
              {activeDeal.website && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={metaKey}>Website</span>
                  <a
                    href={activeDeal.website.startsWith('http') ? activeDeal.website : `https://${activeDeal.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...metaVal, color: '#9d8fff' }}
                  >
                    {activeDeal.website}
                  </a>
                </div>
              )}
            </div>

            {/* Co-Investors */}
            {coInvestors.length > 0 && (
              <div style={card}>
                <span style={sectionLabel}>Co-Investors</span>
                {coInvestors.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '8px', background: '#141414', borderRadius: '6px' }}>
                    <div>
                      <div style={{ color: '#e5e5e5', fontSize: '12px', fontWeight: 500 }}>{c.name}</div>
                      {c.firm && <div style={{ color: '#555', fontSize: '11px' }}>{c.firm}</div>}
                    </div>
                    {c.committed && <div style={{ color: '#9d8fff', fontSize: '12px' }}>{c.committed}</div>}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {activeDeal.notes && (
              <div style={card}>
                <span style={sectionLabel}>Notes</span>
                <div style={{ color: '#888', fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {activeDeal.notes}
                </div>
              </div>
            )}

            {/* Powered by footer */}
            <div style={{ color: '#222', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
              Powered by DealFlow · Shared {formatDate(new Date().toISOString())}
            </div>

          </div>
        </div>
      </div>

      {/* ── Protected Document Viewer Modal ── */}
      {viewingDoc && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9000, background: '#000', display: 'flex', flexDirection: 'column' }}
          onContextMenu={e => e.preventDefault()}
        >
          {/* Viewer toolbar */}
          <div style={{ height: '44px', background: '#0d0d0d', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '12px', flexShrink: 0 }}>
            <span style={{ color: '#ccc', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{viewingDoc.name}</span>
            <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '5px', padding: '3px 10px', color: '#555', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              🔒 View only · {viewerEmail}
            </span>
            <button
              onClick={() => setViewingDoc(null)}
              style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', cursor: 'pointer', fontSize: '14px', padding: '4px 10px', borderRadius: '5px', fontFamily: 'inherit', flexShrink: 0 }}
            >
              ✕ Close
            </button>
          </div>

          {/* iframe */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <iframe
              src={viewingDoc.viewUrl + '#toolbar=0&navpanes=0&statusbar=0&view=FitH'}
              title={viewingDoc.name}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
            {/* Overlay to block any residual browser toolbar buttons */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 44, zIndex: 10, cursor: 'not-allowed' }} />
          </div>
        </div>
      )}
    </div>
  )
}
