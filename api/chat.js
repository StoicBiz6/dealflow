import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a deal intake assistant for an investment deal flow tracker.
Extract deal information from the user's message and return ONLY a valid JSON object — no explanation, no markdown.

Fields:
- company_name (string, required)
- stage (one of: "Sourced", "Investor Targeting", "Diligence", "Term Sheet", "Negotiation", "Closed", "Passed") — default "Sourced"
- raise_amount (number in dollars, e.g. 5000000 for $5M — convert M/B shorthand)
- valuation (number in dollars)
- sector (one of: "Technology", "Gaming", "Media & Entertainment", "Hospitality", "Sports", "Healthcare", "Consumer", "Finance", "Real Estate", "Other")
- deal_owner (string)
- website (string)
- notes (string)

Only include fields the user mentioned. If no company name is identifiable, return:
{"error": "Please include the company name in your message."}`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { message } = req.body
  if (!message?.trim()) return res.status(400).json({ error: 'No message provided' })

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: message }],
    })

    const raw = response.content[0].text.trim()
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const deal = JSON.parse(text)
    res.json(deal)
  } catch (e) {
    console.error('Chat API error:', e?.message, e?.status, e?.error)
    res.status(500).json({ error: e?.message || 'Failed to parse deal.' })
  }
}
