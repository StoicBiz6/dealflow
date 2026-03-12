import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No file URL provided' })

  try {
    const pdfRes = await fetch(url)
    if (!pdfRes.ok) throw new Error('Could not fetch PDF from storage')

    const buffer = await pdfRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
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
  ]
}

Rules:
- contacts: include only key executives/founders/management team (max 5)
- co_investors: include existing investors or co-investors mentioned (max 5), empty array if none
- metrics: only fill fields with actual data from the document, use null for anything not found
- All dollar amounts for raise_amount and valuation must be plain numbers (no $ sign)
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
