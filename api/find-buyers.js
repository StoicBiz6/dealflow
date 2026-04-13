import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // ── action: 'valuation' — comparable company/transaction valuation ──────────
  if (req.body.action === 'valuation') {
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
      return res.json(JSON.parse(text))
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── default: find buyers ─────────────────────────────────────────────────────
  const { deal, types } = req.body
  if (!deal) return res.status(400).json({ error: 'No deal provided' })

  const selectedTypes = Array.isArray(types) && types.length ? types : ['PE', 'Strategic', 'Family Office', 'Growth Equity', 'Direct Lender']

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
        content: `You are an M&A advisor helping identify potential buyers for an investment opportunity.

Deal Profile:
- Company: ${deal.company_name}
- Sector: ${deal.sector || 'Not specified'}
- Raise / Deal Size: ${fmt(deal.raise_amount) || 'Not specified'}
- Valuation: ${fmt(deal.valuation) || 'Not specified'}
- Stage: ${deal.stage || 'Not specified'}
- Description: ${deal.notes || deal.memo || 'No description provided'}

Generate a buyer universe of 10-14 highly relevant potential buyers. Only include buyers of these types: ${selectedTypes.join(', ')}.
${selectedTypes.includes('PE') ? '- Private equity firms with active mandates in this sector/size' : ''}
${selectedTypes.includes('Strategic') ? '- Strategic acquirers or consolidators in adjacent markets' : ''}
${selectedTypes.includes('Family Office') ? '- Family offices known to invest in this vertical' : ''}
${selectedTypes.includes('Growth Equity') ? '- Financial sponsors / growth equity funds' : ''}
${selectedTypes.includes('Direct Lender') ? '- Direct lenders, credit funds, and private credit providers active in this sector and deal size' : ''}

For each buyer, provide:
- Real firm/company name (well-known, verifiable)
- Type: must be one of: ${selectedTypes.map(t => `"${t}"`).join(', ')}
- Why they would be interested (1 sentence, specific to this deal)
- A PitchBook search query string (the firm name as it appears on PitchBook)
- A likely deal contact at the firm: a real or realistic person (Managing Director, Principal, Partner, VP of Corporate Development, etc.) with their name and inferred email. Use the firm's known email domain and common format (e.g. firstname.lastname@firm.com or flastname@firm.com). If unsure of domain use the firm's likely domain based on their name.

Return ONLY valid JSON array:
[
  {
    "name": "Firm Name",
    "type": "PE",
    "thesis": "One sentence rationale specific to this deal",
    "pitchbook_query": "Firm Name as searchable on PitchBook",
    "contact_name": "First Last",
    "contact_title": "Managing Director",
    "email": "firstname.lastname@firm.com",
    "website": "https://www.firm.com"
  }
]

Be specific and realistic — only include buyers who genuinely invest in this sector and deal size range. No markdown, just the JSON array.`,
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()

    const buyers = JSON.parse(text)
    res.json({ buyers })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
