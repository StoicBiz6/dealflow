/**
 * api/google-calendar.js
 * Handles all Google Calendar OAuth + sync in a single function (Hobby plan limit).
 *
 * GET  ?action=auth&userId=xxx&returnTo=xxx  → redirect to Google OAuth
 * GET  ?action=callback&code=xxx&state=xxx  → exchange code, store tokens, redirect back
 * POST { deal, userId }                     → create/update Calendar event
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

// Canonical redirect URI — must match Google Cloud Console exactly
// Use VERCEL_PROJECT_PRODUCTION_URL (stable alias) not VERCEL_URL (per-deploy URL)
const PRODUCTION_URL = 'https://dealflow-zeta.vercel.app'
const getRedirectUri = () => `${PRODUCTION_URL}/api/google-calendar?action=callback`

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
  const { action } = req.query

  // ── GET: OAuth redirect ───────────────────────────────────────────────────
  if (req.method === 'GET' && action !== 'callback') {
    const { userId, returnTo = '/' } = req.query

    if (!userId) return res.status(400).json({ error: 'userId is required' })
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' })

    const state = Buffer.from(JSON.stringify({ userId, returnTo })).toString('base64url')

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.send',
      access_type: 'offline',
      prompt: 'consent',
      state,
    })

    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
  }

  // ── GET: OAuth callback ───────────────────────────────────────────────────
  if (req.method === 'GET' && action === 'callback') {
    const { code, state, error: oauthError } = req.query

    if (oauthError) return res.redirect(302, '/?error=google_auth_denied')
    if (!code || !state) return res.status(400).json({ error: 'Missing code or state' })

    let userId, returnTo
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
      userId = decoded.userId
      returnTo = decoded.returnTo || '/'
    } catch {
      return res.status(400).json({ error: 'Invalid state parameter' })
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({ error: 'Google OAuth credentials not configured' })
    }

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: getRedirectUri(),
          grant_type: 'authorization_code',
        }),
      })

      const tokens = await tokenRes.json()
      if (tokens.error) {
        console.error('Google token exchange error:', tokens)
        return res.redirect(302, `${returnTo}?error=google_token_failed`)
      }

      const { error: dbError } = await supabase
        .from('user_google_tokens')
        .upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + tokens.expires_in * 1000,
        }, { onConflict: 'user_id' })

      if (dbError) {
        console.error('Supabase upsert error:', dbError)
        return res.redirect(302, `${returnTo}?error=token_storage_failed`)
      }

      return res.redirect(302, `${returnTo}?google_auth=success`)
    } catch (err) {
      console.error('Google callback error:', err)
      return res.redirect(302, `${returnTo}?error=google_auth_error`)
    }
  }

  // ── POST: Sync deal to Calendar ───────────────────────────────────────────
  if (req.method === 'POST') {
    const { deal, userId } = req.body

    if (!userId || !deal) return res.status(400).json({ error: 'userId and deal are required' })

    const { data: tokenRow, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenRow) {
      return res.status(401).json({ error: 'Google Calendar not authorized. Please connect via the Calendar button.' })
    }

    let accessToken = tokenRow.access_token

    // Refresh if expired (60s buffer)
    if (tokenRow.expires_at && Date.now() > tokenRow.expires_at - 60000) {
      const refreshed = await refreshAccessToken(tokenRow.refresh_token)
      if (refreshed.error) {
        return res.status(401).json({ error: 'Failed to refresh Google token. Please re-authorize.' })
      }
      accessToken = refreshed.access_token
      await supabase.from('user_google_tokens').update({
        access_token: refreshed.access_token,
        expires_at: Date.now() + refreshed.expires_in * 1000,
      }).eq('user_id', userId)
    }

    const closingDate = deal.timeline_to_close
      ? new Date(deal.timeline_to_close).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const description = [
      `Stage: ${deal.stage || '—'}`,
      deal.raise_amount && `Raise: $${(deal.raise_amount / 1e6).toFixed(1)}M`,
      deal.sector && `Sector: ${deal.sector}`,
      deal.valuation && `Valuation: $${(deal.valuation / 1e6).toFixed(1)}M`,
      deal.deal_owner && `Owner: ${deal.deal_owner}`,
      deal.notes && `\nNotes: ${deal.notes}`,
    ].filter(Boolean).join('\n')

    const event = {
      summary: `Deal: ${deal.company_name}`,
      description,
      start: { date: closingDate },
      end: { date: closingDate },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 60 },
        ],
      },
    }

    try {
      const existingEventId = deal.calendar_event_id
      const url = existingEventId
        ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingEventId}`
        : 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

      const response = await fetch(url, {
        method: existingEventId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      })

      const eventData = await response.json()
      if (!response.ok) {
        return res.status(response.status).json({ error: eventData.error?.message || 'Calendar API error' })
      }

      if (eventData.id && deal.id) {
        await supabase.from('deals').update({ calendar_event_id: eventData.id }).eq('id', deal.id)
      }

      return res.json({ htmlLink: eventData.htmlLink, eventId: eventData.id })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
