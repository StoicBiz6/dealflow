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

export default function DealRoomView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const [deal, setDeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
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

  useEffect(() => {
    if (!isLoaded) return
    if (!user) return // Clerk's SignedIn wrapper handles redirect

    async function load() {
      setLoading(true)
      const { data, error } = await supabase.from('deals').select('*').eq('id', id).single()
      if (error || !data) {
        setLoading(false)
        setAuthChecked(true)
        return
      }

      // Authorization check:
      // 1) User is the deal owner
      // 2) User's email is in shared_with list
      // 3) User is a workspace member (workspace_id match)
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
      } else {
        setAuthorized(false)
      }

      setLoading(false)
      setAuthChecked(true)
    }

    load()
  }, [id, user, isLoaded])

  if (!isLoaded || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
        Loading…
      </div>
    )
  }

  if (authChecked && !authorized) {
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

  if (!deal) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '12px', fontFamily: 'DM Mono, monospace' }}>
        Deal not found.
      </div>
    )
  }

  const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
  const metrics = deal.metrics || {}
  const allDocuments = deal.documents || []
  const documents = deal.shared_docs ? allDocuments.filter(d => deal.shared_docs.includes(d.url)) : allDocuments
  const coInvestors = deal.co_investors || []

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', fontFamily: 'DM Mono, monospace' }}>
      {/* Nav */}
      <nav style={{ height: '52px', background: '#0a0a0a', borderBottom: '1px solid #1f1f1f', display: 'flex', alignItems: 'center', padding: '0 24px', gap: '12px', position: 'sticky', top: 0, zIndex: 40 }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '14px', color: '#f0f0f0', flex: 1 }}>
          {deal.company_name}
        </span>
        <span style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', color: '#555', fontSize: '11px' }}>
          Read-only · Deal Room
        </span>
        <span style={{ color: '#333', fontSize: '11px' }}>
          Viewing as {user?.emailAddresses?.[0]?.emailAddress}
        </span>
      </nav>

      {/* Content */}
      <div style={{ padding: '28px 32px 40px', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#f0f0f0', margin: 0 }}>
            {deal.company_name}
          </h1>
          <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '5px', padding: '3px 12px', fontSize: '11px' }}>
            {deal.stage}
          </span>
          {deal.sector && <span style={{ color: '#555', fontSize: '12px' }}>{deal.sector}</span>}
          {deal.raise_amount && (
            <span style={{ color: '#888', fontSize: '13px', marginLeft: 'auto' }}>
              {formatCurrency(deal.raise_amount)} raise
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '12px' }}>
          {/* Left */}
          <div>

            {/* Investment Memo */}
            {deal.memo && (
              <div style={card}>
                <span style={sectionLabel}>Investment Overview</span>
                <div style={{ color: '#bbb', fontSize: '13px', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {deal.memo}
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
                    const viewerEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || ''
                    const sharedEmails = deal.shared_with || []
                    // Watermark with the INVITED email — the shared_with entry matching this viewer,
                    // or the first recipient's email if the owner is previewing the deal room.
                    const watermarkEmail = sharedEmails.find(e => e.toLowerCase() === viewerEmail) || sharedEmails[0] || viewerEmail
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
                { label: 'Raise', value: formatCurrency(deal.raise_amount) },
                { label: 'Valuation', value: formatCurrency(deal.valuation) },
                { label: 'Sector', value: deal.sector },
                { label: 'Stage', value: deal.stage },
                { label: 'Deal Owner', value: deal.deal_owner },
                (deal.expected_close_date || deal.timeline_to_close) && { label: 'Timeline', value: formatDate(deal.expected_close_date || deal.timeline_to_close) },
              ].filter(r => r && r.value && r.value !== '—').map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={metaKey}>{r.label}</span>
                  <span style={metaVal}>{r.value}</span>
                </div>
              ))}
              {deal.website && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={metaKey}>Website</span>
                  <a
                    href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...metaVal, color: '#9d8fff' }}
                  >
                    {deal.website}
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
            {deal.notes && (
              <div style={card}>
                <span style={sectionLabel}>Notes</span>
                <div style={{ color: '#888', fontSize: '12px', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {deal.notes}
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
              🔒 View only · {user?.emailAddresses?.[0]?.emailAddress}
            </span>
            <button
              onClick={() => setViewingDoc(null)}
              style={{ background: 'none', border: '1px solid #2a2a2a', color: '#666', cursor: 'pointer', fontSize: '14px', padding: '4px 10px', borderRadius: '5px', fontFamily: 'inherit', flexShrink: 0 }}
            >
              ✕ Close
            </button>
          </div>

          {/* iframe — #toolbar=0 disables Chrome/Edge native PDF toolbar (download/print buttons).
              Watermark is baked server-side so any saved copy still carries the viewer's email. */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <iframe
              src={viewingDoc.viewUrl + '#toolbar=0&navpanes=0&statusbar=0&view=FitH'}
              title={viewingDoc.name}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
            {/* Transparent overlay covering the top-right toolbar area to block
                any residual print/download buttons that the browser still renders */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: 200, height: 44, zIndex: 10, cursor: 'not-allowed' }} />
          </div>
        </div>
      )}
    </div>
  )
}
