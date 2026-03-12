import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { transcript } = req.body
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' })

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a deal tracker assistant. A user spoke a voice command to update a deal. Extract only the fields they explicitly mentioned and return ONLY valid JSON.

Voice command: "${transcript}"

Return a JSON object with ONLY the fields the user mentioned — set everything else to null:
{
  "company_name": "string or null",
  "stage": "one of: Sourced, Investor Targeting, Diligence, Term Sheet, Negotiation, Closed, Passed — or null",
  "raise_amount": number in dollars or null (convert spoken amounts: '5 million' → 5000000, '10M' → 10000000),
  "valuation": number in dollars or null,
  "fee_pct": number (e.g. '2 percent' → 2, '1.5%' → 1.5) or null,
  "sector": "one of: Technology, Gaming, Media & Entertainment, Hospitality, Sports, Healthcare, Consumer, Finance, Real Estate, Other — or null",
  "website": "URL string or null",
  "deal_owner": "string or null",
  "notes": "string or null",
  "timeline_to_close": "YYYY-MM-DD date string or null",
  "memo": "string or null",
  "metrics": {
    "revenue": "formatted string e.g. '$42M' or null",
    "ebitda": "formatted string e.g. '$8M' or null",
    "growth_rate": "formatted string e.g. '35% YoY' or null",
    "burn_rate": "formatted string e.g. '$500K/mo' or null"
  }
}

Rules:
- Only include fields the user explicitly mentioned. Set all others to null.
- Money: '5 million' = 5000000, '50M' = 50000000, '1.2 billion' = 1200000000
- Percentages: '2 percent' = 2, '2.5%' = 2.5
- Dates: 'end of Q2' or 'June' = best estimate as YYYY-MM-DD
- Return ONLY the JSON object. No markdown, no explanation.`,
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()

    const parsed = JSON.parse(text)

    // Clean up metrics — remove null fields
    if (parsed.metrics) {
      parsed.metrics = Object.fromEntries(
        Object.entries(parsed.metrics).filter(([, v]) => v !== null && v !== '')
      )
    }

    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
