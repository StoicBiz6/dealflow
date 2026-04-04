import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deal } = req.body
  if (!deal) return res.status(400).json({ error: 'No deal provided' })

  const fmt = (n) =>
    n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M`
    : n ? `$${Number(n).toLocaleString()}` : null

  const metricsText = deal.metrics
    ? Object.entries(deal.metrics).map(([k, v]) => `${k}: ${v}`).join(', ')
    : 'Not available'

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an M&A valuation expert. Based on the deal profile below, provide a comparable company/transaction valuation analysis.

Deal Profile:
- Company: ${deal.company_name}
- Sector: ${deal.sector || 'Not specified'}
- Stage: ${deal.stage || 'Not specified'}
- Raise Amount: ${fmt(deal.raise_amount) || 'Not specified'}
- Current Valuation: ${fmt(deal.valuation) || 'Not specified'}
- Key Metrics: ${metricsText}
- Description: ${deal.notes || deal.memo || 'No description'}

Return ONLY valid JSON with this structure:
{
  "low": 50000000,
  "mid": 75000000,
  "high": 100000000,
  "currency": "USD",
  "method": "Revenue Multiple / EBITDA Multiple / DCF / Precedent Transactions",
  "multiple_used": "e.g. '6-10x Revenue' or '8-12x EBITDA'",
  "rationale": "2-3 sentence explanation of valuation methodology and key value drivers",
  "comps": [
    {
      "company": "Company name",
      "deal_type": "M&A or Fundraise",
      "date": "Approximate date e.g. Q2 2024",
      "value": "Transaction value e.g. $450M",
      "multiple": "Revenue or EBITDA multiple e.g. 8.5x Revenue",
      "notes": "One sentence on relevance to this deal"
    }
  ]
}

Rules:
- low/mid/high: plain numbers in USD (no $ sign)
- comps: 4-6 real comparable transactions or public company multiples from 2022-2025
- Use the most relevant valuation methodology for the sector and stage
- Return ONLY the JSON. No markdown, no explanation.`,
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()

    const parsed = JSON.parse(text)
    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
