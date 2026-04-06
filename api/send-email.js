import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Build a raw RFC-2822 message and send via Gmail API
async function sendViaGmail(accessToken, { to, subject, body, html }) {
  const from = 'me'
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
  if (!response.ok) throw new Error(data.error?.message || 'Gmail API error')
  return data
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

  // Try Gmail API first if userId provided and token exists
  if (userId) {
    try {
      const { data: tokenRow } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (tokenRow) {
        let accessToken = tokenRow.access_token

        // Refresh if expired
        if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
          const refreshed = await refreshToken(tokenRow.refresh_token)
          if (!refreshed.error) {
            accessToken = refreshed.access_token
            await supabase.from('user_google_tokens').update({
              access_token: refreshed.access_token,
              expires_at: Date.now() + refreshed.expires_in * 1000,
            }).eq('user_id', userId)
          }
        }

        const result = await sendViaGmail(accessToken, { to, subject, body, html })
        return res.json({ messageId: result.id, success: true, via: 'gmail' })
      }
    } catch (e) {
      console.error('Gmail send failed, falling back to Resend:', e.message)
    }
  }

  // Fallback: Resend
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM_EMAIL = process.env.FROM_EMAIL || 'mb@stoicpartner.com'

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      ...(html ? { html } : { text: body }),
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.json({ messageId: data.id, success: true, via: 'resend' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
