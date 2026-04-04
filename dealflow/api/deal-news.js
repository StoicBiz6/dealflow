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

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are an M&A market intelligence analyst. Based on the deal profile below, provide recent market intelligence including comparable transactions and investor activity.

Deal Profile:
- Company: ${deal.company_name}
- Sector: ${deal.sector || 'Not specified'}
- Stage: ${deal.stage || 'Not specified'}
- Deal Size: ${fmt(deal.raise_amount) || 'Not specified'}
- Valuation: ${fmt(deal.valuation) || 'Not specified'}
- Description: ${deal.notes || deal.memo || 'No description'}

Return ONLY valid JSON with this structure:
{
  "comparable_deals": [
    {
      "title": "Short deal headline (e.g. 'XYZ Corp raises $50M Series C')",
      "company": "Company name",
      "amount": "Deal size (e.g. '$50M')",
      "date": "Approximate date (e.g. 'Q3 2024')",
      "investors": ["Lead investor", "Co-investor"],
      "relevance": "One sentence why this is comparable to the deal above"
    }
  ],
  "active_investors": [
    {
      "name": "Investor or Fund name",
      "type": "PE or VC or Growth Equity or Family Office or Strategic",
      "recent_activity": "One sentence describing their recent deal activity in this sector and size range"
    }
  ],
  "market_trends": [
    {
      "trend": "Trend headline (5-8 words)",
      "detail": "One sentence elaboration relevant to this deal"
    }
  ]
}

Rules:
- comparable_deals: 4-6 real, verifiable deals from 2023-2025 in the same sector and approximate size range. Use actual company names and specific deal details.
- active_investors: 4-6 funds/firms known to be active in this sector and deal size right now
- market_trends: 3-4 current macro or sector trends directly relevant to this deal type
- Return ONLY the JSON object. No markdown, no explanation.`,
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
