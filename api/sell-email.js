import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { mandate, buyer } = req.body
  if (!mandate) return res.status(400).json({ error: 'No mandate provided' })

  const evRange = mandate.ev_low && mandate.ev_high
    ? `$${mandate.ev_low}M–$${mandate.ev_high}M`
    : 'undisclosed'

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Write a professional sell-side M&A buyer outreach email. Keep it concise (3 short paragraphs), direct, and professional. End with an offer to send the teaser and schedule a call.

Mandate:
- Project name: ${mandate.name}
- Sector: ${mandate.sector || 'N/A'}
- EV range: ${evRange}
- Stage: ${mandate.stage || 'NDA / CIM'}
- Summary: ${mandate.notes || 'Confidential sale process'}
${buyer ? `\nTarget buyer: ${buyer.name} (${buyer.type || 'Buyer'})` : ''}

Return ONLY valid JSON:
{
  "subject": "email subject line",
  "body": "full plain-text email body with \\n for line breaks"
}
No markdown, just JSON.`,
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()
    res.json(JSON.parse(text))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
