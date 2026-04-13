/**
 * api/deal-room-access.js
 * Custom OTP-based access for deal rooms — no Clerk account required.
 *
 * POST { action: 'send', dealId, email }    → validate invite, generate OTP, send via Resend
 * POST { action: 'verify', dealId, email, code } → verify OTP, return deal data
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

const resend = new Resend(process.env.RESEND_API_KEY)

function hashCode(code) {
  return createHash('sha256').update(code).digest('hex')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { action, dealId, email, code } = req.body

  // ── SEND OTP ─────────────────────────────────────────────────────────────────
  if (action === 'send') {
    if (!dealId || !email) {
      return res.status(400).json({ error: 'Missing dealId or email' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Look up deal
    const { data: deal } = await supabase
      .from('deals')
      .select('company_name, shared_with')
      .eq('id', dealId)
      .single()

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }

    // Verify email is on the invite list
    const sharedWith = deal.shared_with || []
    const isInvited = sharedWith.some(e => e.toLowerCase() === normalizedEmail)
    if (!isInvited) {
      return res.status(403).json({
        error: 'This email address has not been invited to view this deal room. Contact the deal owner to request access.',
      })
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = hashCode(otp)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min

    // Store OTP (invalidate old ones for same deal+email automatically via expiry)
    await supabase.from('deal_room_otps').insert({
      deal_id: dealId,
      email: normalizedEmail,
      code_hash: codeHash,
      expires_at: expiresAt,
    })

    // Send email
    const fromEmail = process.env.FROM_EMAIL || 'noreply@stoicpartner.com'
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: normalizedEmail,
      subject: `Your access code for the ${deal.company_name} deal room`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e5e5e5;border-radius:12px">
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
        </div>
      `,
    })

    if (sendError) {
      console.error('[deal-room-access] Resend error:', sendError)
      return res.status(500).json({ error: sendError.message || JSON.stringify(sendError) })
    }

    return res.json({ sent: true })
  }

  // ── VERIFY OTP ───────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!dealId || !email || !code) {
      return res.status(400).json({ error: 'Missing dealId, email, or code' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const codeHash = hashCode(code.trim())
    const now = new Date().toISOString()

    // Find a valid, unused, unexpired OTP
    const { data: otpRow } = await supabase
      .from('deal_room_otps')
      .select('*')
      .eq('deal_id', dealId)
      .eq('email', normalizedEmail)
      .eq('code_hash', codeHash)
      .gt('expires_at', now)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!otpRow) {
      return res.status(401).json({ error: 'Invalid or expired code. Please try again.' })
    }

    // Mark as used
    await supabase
      .from('deal_room_otps')
      .update({ used_at: now })
      .eq('id', otpRow.id)

    // Return full deal data
    const { data: deal } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' })
    }

    // Log the view + notify owner (fire-and-forget)
    fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/notify-deal-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId, viewerEmail: normalizedEmail }),
    }).catch(() => {})

    return res.json({ deal, viewerEmail: normalizedEmail })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
