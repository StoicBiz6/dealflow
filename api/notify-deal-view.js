import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
)

async function refreshAccessToken(refreshToken) {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { dealId, viewerEmail } = req.body
  if (!dealId || !viewerEmail) {
    return res.status(400).json({ error: 'Missing dealId or viewerEmail' })
  }

  try {
    // Dedup: only notify once per viewer per deal per 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recent } = await supabase
      .from('deal_room_views')
      .select('id')
      .eq('deal_id', dealId)
      .eq('viewer_email', viewerEmail.toLowerCase())
      .gte('viewed_at', since)
      .limit(1)

    if (recent && recent.length > 0) {
      return res.json({ notified: false, reason: 'already_notified_recently' })
    }

    // Log the view
    await supabase.from('deal_room_views').insert({
      deal_id: dealId,
      viewer_email: viewerEmail.toLowerCase(),
    })

    // Look up the deal to get owner info
    const { data: deal } = await supabase
      .from('deals')
      .select('company_name, user_id')
      .eq('id', dealId)
      .single()

    if (!deal) return res.json({ notified: false, reason: 'deal_not_found' })

    // Get owner's Google token
    const { data: tokenRow } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', deal.user_id)
      .single()

    if (!tokenRow) return res.json({ notified: false, reason: 'no_google_token' })

    let accessToken = tokenRow.access_token
    if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token)
      if (!refreshed.error) {
        accessToken = refreshed.access_token
        await supabase.from('user_google_tokens').update({
          access_token: refreshed.access_token,
          expires_at: Date.now() + refreshed.expires_in * 1000,
        }).eq('user_id', deal.user_id)
      }
    }

    // Get owner's email from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const profile = await profileRes.json()
    const ownerEmail = profile.email
    if (!ownerEmail) return res.json({ notified: false, reason: 'no_owner_email' })

    const viewedAt = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

    const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#0d0d0d;color:#e5e5e5;border-radius:12px">
  <div style="font-size:22px;font-weight:700;margin-bottom:6px;color:#f0f0f0">${deal.company_name}</div>
  <div style="font-size:13px;color:#666;margin-bottom:28px;text-transform:uppercase;letter-spacing:0.06em">Deal Room Viewed</div>
  <p style="font-size:14px;color:#aaa;line-height:1.6;margin-bottom:8px">
    <strong style="color:#e5e5e5">${viewerEmail}</strong> just viewed your <strong style="color:#e5e5e5">${deal.company_name}</strong> deal room.
  </p>
  <p style="font-size:12px;color:#555;margin:0">${viewedAt}</p>
  <hr style="border:none;border-top:1px solid #1f1f1f;margin:24px 0">
  <p style="font-size:11px;color:#333;margin:0">Sent via DealFlow by Stoic Partner</p>
</div>`

    const message = [
      `To: ${ownerEmail}`,
      `Subject: ${viewerEmail} viewed the ${deal.company_name} deal room`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      '',
      html,
    ].join('\r\n')

    const encoded = Buffer.from(message).toString('base64url')

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    })

    if (!gmailRes.ok) {
      const err = await gmailRes.json()
      console.error('[notify-deal-view] Gmail error:', err)
      return res.json({ notified: false, reason: 'gmail_error' })
    }

    return res.json({ notified: true })
  } catch (e) {
    console.error('[notify-deal-view] error:', e)
    return res.status(500).json({ error: e.message })
  }
}
