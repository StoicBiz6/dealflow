/**
 * api/google-calendar-sync.js
 * Creates or updates a Google Calendar event for a deal.
 * POST { deal, userId }
 * Returns { htmlLink, eventId } on success.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function refreshAccessToken(refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })
  return res.json()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { deal, userId } = req.body

  if (!userId || !deal) {
    return res.status(400).json({ error: 'userId and deal are required' })
  }

  // Fetch stored tokens from Supabase
  const { data: tokenRow, error: tokenError } = await supabase
    .from('user_google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (tokenError || !tokenRow) {
    return res.status(401).json({ error: 'Google Calendar not authorized. Please connect via /api/google-auth.' })
  }

  let accessToken = tokenRow.access_token

  // Refresh if expired (with 60s buffer)
  if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
    const refreshed = await refreshAccessToken(tokenRow.refresh_token)
    if (refreshed.error) {
      return res.status(401).json({ error: 'Failed to refresh Google token. Please re-authorize.' })
    }
    accessToken = refreshed.access_token
    // Update stored token
    await supabase.from('user_google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: Date.now() + refreshed.expires_in * 1000,
    }).eq('user_id', userId)
  }

  // Build event details
  const closingDate = deal.timeline_to_close
    ? new Date(deal.timeline_to_close).toISOString().slice(0, 10)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)  // default 30 days out

  const raiseStr = deal.raise_amount
    ? `$${(deal.raise_amount / 1e6).toFixed(1)}M raise`
    : ''

  const description = [
    `Stage: ${deal.stage || '—'}`,
    raiseStr && `Raise: ${raiseStr}`,
    deal.sector && `Sector: ${deal.sector}`,
    deal.valuation && `Valuation: $${(deal.valuation / 1e6).toFixed(1)}M`,
    deal.deal_owner && `Owner: ${deal.deal_owner}`,
    '',
    deal.notes ? `Notes: ${deal.notes}` : '',
  ].filter(l => l !== undefined && l !== false).join('\n')

  const event = {
    summary: `Deal: ${deal.company_name}`,
    description: description.trim(),
    start: { date: closingDate },
    end: { date: closingDate },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },   // 1 day before
        { method: 'popup', minutes: 60 },          // 1 hour before
      ],
    },
  }

  try {
    // Check if event already exists (stored on deal as calendar_event_id)
    const existingEventId = deal.calendar_event_id

    let response
    if (existingEventId) {
      // Update existing event
      response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )
    } else {
      // Create new event
      response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      )
    }

    const eventData = await response.json()

    if (!response.ok) {
      console.error('Google Calendar API error:', eventData)
      return res.status(response.status).json({ error: eventData.error?.message || 'Calendar API error' })
    }

    // Store event ID on the deal for future updates
    if (eventData.id && deal.id) {
      await supabase
        .from('deals')
        .update({ calendar_event_id: eventData.id })
        .eq('id', deal.id)
    }

    return res.json({
      htmlLink: eventData.htmlLink,
      eventId: eventData.id,
    })
  } catch (err) {
    console.error('Calendar sync error:', err)
    return res.status(500).json({ error: err.message })
  }
}
