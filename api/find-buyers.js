import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deal, types } = req.body
  if (!deal) return res.status(400).json({ error: 'No deal provided' })

  const selectedTypes = Array.isArray(types) && types.length ? types : ['PE', 'Strategic', 'Family Office', 'Growth Equity']

  const fmt = (n) =>
    n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M`
    : n ? `$${Number(n).toLocaleString()}` : null

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
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
