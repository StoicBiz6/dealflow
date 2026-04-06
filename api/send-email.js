import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
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

  const { to, subject, body, html, userId } = req.body
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email address' })
  }

  if (!userId) {
    return res.status(401).json({ error: 'Connect Google via the Calendar button to enable email sending.' })
  }

  // Get stored Google token
  const { data: tokenRow } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokenRow) {
    return res.status(401).json({ error: 'Connect Google via the Calendar button to enable email sending.' })
  }

  let accessToken = tokenRow.access_token

  // Refresh if expired
  if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    if (refreshed.error) {
      return res.status(401).json({ error: 'Google token expired. Please reconnect via the Calendar button.' })
    }
    accessToken = refreshed.access_token
    await supabase.from('user_google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    }).eq('user_id', userId)
  }

  // Build RFC-2822 message
  const content = html || body
  const isHtml = !!html
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
    '',
    content,
  ].join('\r\n')

  const encoded = Buffer.from(message).toString('base64url')

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encoded }),
      }
    )
    const data = await response.json()
    if (!response.ok) {
      // If scope missing, prompt re-auth
      if (data.error?.status === 'PERMISSION_DENIED') {
        return res.status(403).json({ error: 'Gmail permission not granted. Click the Calendar button to reconnect Google and allow email access.' })
      }
      return res.status(response.status).json({ error: data.error?.message || 'Gmail API error' })
    }
    return res.json({ messageId: data.id, success: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
