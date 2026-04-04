import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const action = req.query.action
  if (!action) return res.status(400).json({ error: 'Missing action' })

  if (action === 'valuation') return handleValuation(req, res)
  if (action === 'parse-cim') return handleParseCIM(req, res)
  if (action === 'email') return handleEmail(req, res)
  return res.status(400).json({ error: `Unknown action: ${action}` })
}

async function handleValuation(req, res) {
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

async function handleParseCIM(req, res) {
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

async function handleEmail(req, res) {
  const { mandate, buyer } = req.body
  if (!mandate) return res.status(400).json({ error: 'No mandate provided' })

  const evRange = mandate.ev_low && mandate.ev_high
    ? `$${mandate.ev_low}M–$${mandate.ev_high}M`
    : 'undisclosed'

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `Write a professional sell-side M&A buyer outreach email. Keep it concise (3 short paragraphs), direct, and professional. End with an offer to send the teaser and schedule a call.

Mandate:
- Project name: ${mandate.name}
- Sector: ${mandate.sector || 'N/A'}
- EV range: ${evRange}
- Stage: ${mandate.stage || 'NDA / CIM'}
- Summary: ${mandate.notes || 'Confidential sale process'}
${buyer ? `\nTarget buyer: ${buyer.name} (${buyer.type || 'Buyer'})` : ''}

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
