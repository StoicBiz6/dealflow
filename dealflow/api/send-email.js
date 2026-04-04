import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = process.env.FROM_EMAIL || 'mb@stoicpartner.com'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, subject, body } = req.body
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' })
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(to)) {
    return res.status(400).json({ error: 'Invalid recipient email address' })
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      ...(req.body.html ? { html: req.body.html } : { text: body }),
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ messageId: data.id, success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
