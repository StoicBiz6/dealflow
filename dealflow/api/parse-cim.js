import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // ── action: 'qa' — answer a question about a deal using its context ──────────
  if (req.body.action === 'qa') {
    const { question, deal } = req.body
    if (!question || !deal) return res.status(400).json({ error: 'Missing question or deal context' })

    const fmt = (n) =>
      n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B`
      : n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M`
      : n ? `$${Number(n).toLocaleString()}` : null

    const metricsText = deal.metrics
      ? Object.entries(deal.metrics).map(([k, v]) => `  ${k}: ${v}`).join('\n')
      : 'No metrics available'

    const context = `Deal: ${deal.company_name}
Sector: ${deal.sector || 'Unknown'}
Stage: ${deal.stage || 'Unknown'}
Raise: ${fmt(deal.raise_amount) || 'Not specified'}
Valuation: ${fmt(deal.valuation) || 'Not specified'}
${deal.timeline_to_close ? `Timeline to Close: ${deal.timeline_to_close}` : ''}

Investment Summary:
${deal.notes || 'No summary available'}

Investment Thesis / Memo:
${deal.memo || 'No memo available'}

Key Metrics:
${metricsText}

${deal.score ? `Deal Scores (1-5 scale):
  Team: ${deal.score.team}/5
  Market: ${deal.score.market}/5
  Traction: ${deal.score.traction}/5
  Terms: ${deal.score.terms}/5
  Overall: ${deal.score.overall}/5
  ${deal.score.rationale ? `Rationale: ${deal.score.rationale}` : ''}` : ''}`

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `You are an expert M&A analyst assistant helping a deal professional analyze a specific transaction.
Answer questions about this deal based only on the provided context. Be concise and direct.
If the context doesn't contain enough information to answer fully, say so clearly.
Focus on actionable insights relevant to M&A advisory.`,
        messages: [{ role: 'user', content: `Deal Context:\n${context}\n\nQuestion: ${question}` }],
      })
      return res.json({ answer: response.content[0].text.trim() })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  // ── default action: parse a CIM PDF ─────────────────────────────────────────
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No file URL provided' })

  try {
    const pdfRes = await fetch(url)
    if (!pdfRes.ok) throw new Error('Could not fetch PDF from storage')

    const buffer = await pdfRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `Extract all deal information from this CIM (Confidential Information Memorandum) and return ONLY valid JSON with these fields:

{
  "company_name": "required string — company/deal name",
  "stage": "one of: Sourced, Investor Targeting, Diligence, Term Sheet, Negotiation, Closed, Passed",
  "raise_amount": number in dollars or null (e.g. 175000000 for $175M),
  "valuation": number in dollars or null,
  "sector": "one of: Technology, Gaming, Media & Entertainment, Hospitality, Sports, Healthcare, Consumer, Finance, Real Estate, Other",
  "website": "company website URL or null",
  "deal_owner": "banker/advisor firm name if mentioned, or null",
  "notes": "2-3 sentence summary of the business and key investment highlights",
  "memo": "4-6 sentence detailed investment thesis covering business model, competitive moat, growth drivers, and why this is a compelling deal",
  "timeline_to_close": "ISO date string (YYYY-MM-DD) for expected close date if mentioned, or null",
  "metrics": {
    "revenue": "LTM or ARR revenue as formatted string e.g. '$42M' or null",
    "ebitda": "LTM EBITDA as formatted string e.g. '$8.5M' or null",
    "ebitda_margin": "EBITDA margin as string e.g. '22%' or null",
    "arr": "Annual Recurring Revenue if SaaS, e.g. '$18M ARR' or null",
    "growth_rate": "Revenue growth rate e.g. '35% YoY' or null",
    "gross_margin": "Gross margin percentage e.g. '68%' or null",
    "employees": "headcount as string e.g. '120' or null",
    "founded": "founding year as string e.g. '2018' or null",
    "other": "any other key financial metric worth noting as a string, or null"
  },
  "contacts": [
    {
      "name": "full name of executive",
      "firm": "their title e.g. CEO, CFO, Founder",
      "email": "email if mentioned or empty string",
      "notes": "brief note about their background if available"
    }
  ],
  "co_investors": [
    {
      "name": "investor/fund name",
      "firm": "parent firm if different, or same as name",
      "committed": "amount committed as string e.g. '$10M' or empty string"
    }
  ],
  "score": {
    "team": 3,
    "market": 3,
    "traction": 3,
    "terms": 3,
    "overall": 3,
    "rationale": "2-3 sentence explanation of the scores highlighting key strengths and weaknesses"
  }
}

Rules:
- contacts: include only key executives/founders/management team (max 5)
- co_investors: include existing investors or co-investors mentioned (max 5), empty array if none
- metrics: only fill fields with actual data from the document, use null for anything not found
- All dollar amounts for raise_amount and valuation must be plain numbers (no $ sign)
- score: rate each dimension 1-5 (1=weak, 3=average, 5=exceptional) based on what the CIM reveals
  - team: management depth, track record, relevant experience
  - market: TAM size, growth rate, competitive dynamics
  - traction: revenue, growth, customer proof points, product maturity
  - terms: valuation attractiveness, deal structure, use of funds clarity
  - overall: holistic deal quality as an M&A/fundraising opportunity
- Return ONLY the JSON object. No markdown, no explanation.`,
          },
        ],
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()

    const parsed = JSON.parse(text)

    // Add UUIDs to contacts and co_investors (required by DealPage)
    if (Array.isArray(parsed.contacts)) {
      parsed.contacts = parsed.contacts.map(c => ({ ...c, id: crypto.randomUUID() }))
    } else {
      parsed.contacts = []
    }
    if (Array.isArray(parsed.co_investors)) {
      parsed.co_investors = parsed.co_investors.map(c => ({ ...c, id: crypto.randomUUID() }))
    } else {
      parsed.co_investors = []
    }

    // Clean up metrics — remove null fields
    if (parsed.metrics) {
      parsed.metrics = Object.fromEntries(Object.entries(parsed.metrics).filter(([, v]) => v !== null && v !== ''))
    }

    res.json(parsed)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
