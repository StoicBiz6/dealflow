import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { base64, name } = req.body
  if (!base64) return res.status(400).json({ error: 'No PDF data provided' })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          {
            type: 'text',
            text: `Extract sell-side mandate information from this CIM (Confidential Information Memorandum). Return ONLY valid JSON:

{
  "name": "Project code name or company name",
  "sector": "Industry sector",
  "ev_low": 150000000,
  "ev_high": 220000000,
  "stage": "one of: Prep phase, NDA / CIM, Mgmt meetings, First round bids, Final round, Exclusivity, Sign & close",
  "lead_advisor": "advisory firm name if mentioned",
  "revenue": "LTM revenue as string e.g. '$42M'",
  "ebitda": "LTM EBITDA as string e.g. '$8.5M'",
  "ebitda_margin": "EBITDA margin e.g. '22%'",
  "growth_rate": "Revenue growth e.g. '25% YoY'",
  "employees": "headcount as string",
  "founded": "founding year",
  "business_summary": "3–4 sentence description of the business, model, and key investment highlights",
  "contacts": [
    { "role": "e.g. CEO, CFO, Founder", "name": "Full name" }
  ]
}

Rules:
- ev_low/ev_high: plain USD numbers (null if not found)
- contacts: key executives only, max 5
- stage: default to 'NDA / CIM' if unclear
- Return ONLY the JSON. No markdown.`,
          },
        ],
      }],
    })

    let text = response.content[0].text.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim()
    res.json(JSON.parse(text))
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
