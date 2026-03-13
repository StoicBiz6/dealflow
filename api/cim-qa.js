import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

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
      messages: [{
        role: 'user',
        content: `Deal Context:\n${context}\n\nQuestion: ${question}`,
      }],
    })

    res.json({ answer: response.content[0].text.trim() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
