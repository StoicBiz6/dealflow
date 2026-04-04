import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deal } = req.body
  if (!deal) return res.status(400).json({ error: 'No deal provided' })

  const fmt = (n) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n ? `$${Number(n).toLocaleString()}` : null

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `Write a professional deal outreach email for the following investment opportunity. Keep it concise (3 short paragraphs), warm but direct. End with an offer to share the full CIM and schedule a call.

Deal:
- Company: ${deal.company_name}
- Stage: ${deal.stage || 'N/A'}
- Sector: ${deal.sector || 'N/A'}
- Raise: ${fmt(deal.raise_amount) || 'N/A'}
- Valuation: ${fmt(deal.valuation) || 'N/A'}
- Summary: ${deal.notes || deal.memo || 'See attached CIM'}

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
