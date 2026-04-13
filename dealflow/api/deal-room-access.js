/**
 * api/deal-room-access.js
 * Custom OTP-based access for deal rooms — no Clerk account required.
 * Sends OTP via the deal owner's Gmail (OAuth token already stored).
 *
 * POST { action: 'send',   dealId, email }        → validate invite, send OTP via Gmail
 * POST { action: 'verify', dealId, email, code }  → verify OTP, return deal data
 * POST { action: 'notify', dealId, viewerEmail }  → log view + Gmail notify owner
 */
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

function hashCode(code) {
  return createHash('sha256').update(code).digest('hex')
}

async function refreshToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

async function getAccessToken(userId) {
  const { data: tokenRow } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (!tokenRow) return null

  let accessToken = tokenRow.access_token
  if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
    const refreshed = await refreshToken(tokenRow.refresh_token)
    if (refreshed.error) return null
    accessToken = refreshed.access_token
    await supabase.from('user_google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    }).eq('user_id', userId)
  }
  return accessToken
}

async function sendGmail(accessToken, to, subject, html) {
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n')

  const encoded = Buffer.from(message).toString('base64url')
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  })
  return res
}

async function notifyDealView(dealId, viewerEmail) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('deal_room_views').select('id')
      .eq('deal_id', dealId).eq('viewer_email', viewerEmail)
      .gte('viewed_at', since).limit(1)
    if (recent && recent.length > 0) return

    await supabase.from('deal_room_views').insert({ deal_id: dealId, viewer_email: viewerEmail })

    const { data: deal } = await supabase.from('deals').select('company_name, user_id').eq('id', dealId).single()
    if (!deal) return

    const accessToken = await getAccessToken(deal.user_id)
    if (!accessToken) return

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } })
    const profile = await profileRes.json()
    if (!profile.email) return

    const viewedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e5e5e5;border-radius:12px"><div style="font-size:22px;font-weight:700;margin-bottom:6px;color:#f0f0f0">${deal.company_name}</div><div style="font-size:13px;color:#666;margin-bottom:28px;text-transform:uppercase;letter-spacing:0.06em">Deal Room Viewed</div><p style="font-size:14px;color:#aaa;line-height:1.6;margin-bottom:8px"><strong style="color:#e5e5e5">${viewerEmail}</strong> just viewed your <strong style="color:#e5e5e5">${deal.company_name}</strong> deal room.</p><p style="font-size:12px;color:#555;margin:0">${viewedAt}</p><hr style="border:none;border-top:1px solid #1f1f1f;margin:24px 0"><p style="font-size:11px;color:#333;margin:0">Sent via DealFlow by Stoic Partner</p></div>`
    await sendGmail(accessToken, profile.email, `${viewerEmail} viewed the ${deal.company_name} deal room`, html)
  } catch (e) {
    console.error('[notify-deal-view] error:', e)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, dealId, email, code } = req.body

  // ── SEND OTP ─────────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!dealId || !email) return res.status(400).json({ error: 'Missing dealId or email' })

    const normalizedEmail = email.trim().toLowerCase()

    const { data: deal } = await supabase
      .from('deals').select('company_name, shared_with, user_id').eq('id', dealId).single()
    if (!deal) return res.status(404).json({ error: 'Deal not found' })

    const sharedWith = deal.shared_with || []
    const isInvited = sharedWith.some(e => e.toLowerCase() === normalizedEmail)
    if (!isInvited) {
      return res.status(403).json({ error: 'This email has not been invited to view this deal room. Contact the deal owner to request access.' })
    }

    // Generate & store OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = hashCode(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    await supabase.from('deal_room_otps').insert({ deal_id: dealId, email: normalizedEmail, code_hash: codeHash, expires_at: expiresAt })

    // Send via deal owner's Gmail
    const accessToken = await getAccessToken(deal.user_id)
    if (!accessToken) {
      return res.status(500).json({ error: 'Deal owner has not connected Gmail. Ask them to connect Google via the Calendar button.' })
    }

    const html = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e5e5e5;border-radius:12px">
      <div style="font-size:20px;font-weight:700;margin-bottom:6px;color:#f0f0f0">${deal.company_name}</div>
      <div style="font-size:12px;color:#666;margin-bottom:28px;text-transform:uppercase;letter-spacing:0.06em">Deal Room Access</div>
      <p style="font-size:14px;color:#aaa;line-height:1.6;margin-bottom:24px">
        Use the code below to access the <strong style="color:#e5e5e5">${deal.company_name}</strong> deal room. It expires in 15 minutes.
      </p>
      <div style="background:#111;border:1px solid #2a2a2a;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
        <div style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:0.3em;color:#9d8fff">${otp}</div>
      </div>
      <p style="font-size:12px;color:#555;margin:0">If you didn't request this, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid #1f1f1f;margin:24px 0">
      <p style="font-size:11px;color:#333;margin:0">Sent via DealFlow by Stoic Partner</p>
    </div>`

    const gmailRes = await sendGmail(accessToken, normalizedEmail, `Your access code for the ${deal.company_name} deal room`, html)
    if (!gmailRes.ok) {
      const err = await gmailRes.json()
      console.error('[deal-room-access] Gmail send error:', err)
      return res.status(500).json({ error: err.error?.message || 'Failed to send email. Please try again.' })
    }

    return res.json({ sent: true })
  }

  // ── VERIFY OTP ───────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!dealId || !email || !code) return res.status(400).json({ error: 'Missing dealId, email, or code' })

    const normalizedEmail = email.trim().toLowerCase()
    const codeHash = hashCode(code.trim())
    const now = new Date().toISOString()

    const { data: otpRow } = await supabase
      .from('deal_room_otps').select('*')
      .eq('deal_id', dealId).eq('email', normalizedEmail).eq('code_hash', codeHash)
      .gt('expires_at', now).is('used_at', null)
      .order('created_at', { ascending: false }).limit(1).single()

    if (!otpRow) return res.status(401).json({ error: 'Invalid or expired code. Please try again.' })

    await supabase.from('deal_room_otps').update({ used_at: now }).eq('id', otpRow.id)

    const { data: deal } = await supabase.from('deals').select('*').eq('id', dealId).single()
    if (!deal) return res.status(404).json({ error: 'Deal not found' })

    notifyDealView(dealId, normalizedEmail) // fire-and-forget

    return res.json({ deal, viewerEmail: normalizedEmail })
  }

  // ── NOTIFY (Clerk-authenticated viewers) ────────────────────────────────────
  if (action === 'notify') {
    const { dealId: dId, viewerEmail: vEmail } = req.body
    if (dId && vEmail) notifyDealView(dId, vEmail.toLowerCase())
    return res.json({ ok: true })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
