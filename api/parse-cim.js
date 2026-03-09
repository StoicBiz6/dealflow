import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'No file URL provided' })

  try {
    // Fetch the PDF from Supabase Storage
    const pdfRes = await fetch(url)
    if (!pdfRes.ok) throw new Error('Could not fetch PDF from storage')

    const buffer = await pdfRes.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          },
          {
            type: 'text',
            text: `Extract deal information from this CIM (Confidential Information Memorandum).
Return ONLY valid JSON with these fields:
{
  "company_name": "required string",
  "stage": "one of: Sourced, Investor Targeting, Diligence, Term Sheet, Negotiation, Closed, Passed",
  "raise_amount": number in dollars or null,
  "valuation": number in dollars or null,
  "sector": "one of: Technology, Gaming, Media & Entertainment, Hospitality, Sports, Healthcare, Consumer, Finance, Real Estate, Other",
  "website": "string or null",
  "notes": "2-3 sentence summary of the business and key investment highlights"
}
Return ONLY the JSON object. No markdown, no explanation.`,
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
