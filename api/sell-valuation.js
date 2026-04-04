import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { mandate } = req.body
  if (!mandate) return res.status(400).json({ error: 'No mandate provided' })

  const evRange = mandate.ev_low && mandate.ev_high
    ? `$${mandate.ev_low}M–$${mandate.ev_high}M`
    : mandate.ev_low ? `$${mandate.ev_low}M+` : 'Not specified'

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an M&A sell-side advisor. Estimate the enterprise value range buyers will pay for this company and provide supporting analysis.

Mandate:
- Project name: ${mandate.name}
- Sector: ${mandate.sector || 'Not specified'}
- Seller EV guidance: ${evRange}
- Stage: ${mandate.stage || 'Not specified'}
- Lead advisor: ${mandate.lead_advisor || 'Not specified'}
- Notes: ${mandate.notes || 'None'}

Return ONLY valid JSON:
{
  "ev_low": 150000000,
  "ev_mid": 185000000,
  "ev_high": 220000000,
  "currency": "USD",
  "primary_method": "EBITDA Multiple / Revenue Multiple / DCF",
  "sponsor_range": "$X–$YM (X–Yx EBITDA)",
  "strategic_premium": "X–Y% above sponsor",
  "key_drivers": ["driver 1", "driver 2", "driver 3"],
  "risks": ["risk 1", "risk 2"],
  "rationale": "3–4 sentence explanation of the valuation range and methodology",
  "comps": [
    {
      "target": "Company name",
      "acquirer": "Acquirer name",
      "date": "e.g. Q3 2024",
      "ev": "$XXXm",
      "multiple": "e.g. 14x EBITDA",
      "notes": "One sentence on relevance"
    }
  ]
}

Rules:
- ev_low/mid/high: plain USD numbers
- comps: 4–6 real M&A transactions from 2021–2025 in the same sector
- sponsor_range: what PE firms are likely to pay
- strategic_premium: typical uplift strategics pay over sponsors in this sector
- Return ONLY the JSON. No markdown.`,
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()
    res.json(JSON.parse(text))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
