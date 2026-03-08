import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert in investment deal sourcing and family office networks.
Given a deal's details, suggest 5 relevant family offices or institutional investors that would likely be interested.

Return ONLY a valid JSON array (no markdown, no explanation) with this structure:
[
  {
    "firm": "Family office or firm name",
    "name": "Key contact person's name",
    "email": "likely email based on firm domain (educated guess format like firstname@firmdomain.com)",
    "notes": "1 sentence on why they'd be interested"
  }
]

Base suggestions on the deal's sector, raise amount, and stage. Focus on real, well-known family offices and institutional investors relevant to the sector.`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { deal } = req.body
  if (!deal) return res.status(400).json({ error: 'No deal provided' })

  const dealSummary = `Company: ${deal.company_name}, Sector: ${deal.sector || 'Unknown'}, Raise: ${deal.raise_amount ? '$' + (deal.raise_amount / 1e6).toFixed(1) + 'M' : 'Unknown'}, Stage: ${deal.stage}, Notes: ${deal.notes || 'None'}`

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: dealSummary }],
    })

    const raw = response.content[0].text.trim()
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const contacts = JSON.parse(text)
    res.json({ contacts })
  } catch (e) {
    console.error('Contacts API error:', e?.message)
    res.status(500).json({ error: e?.message || 'Failed to generate contacts.' })
  }
}
