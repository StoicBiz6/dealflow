/**
 * api/google-auth.js
 * Redirects user to Google OAuth consent screen to authorize Calendar access.
 * Query params: ?userId=<clerk_user_id>&returnTo=<path>
 */
export default function handler(req, res) {
  const { userId, returnTo = '/' } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return res.status(500).json({ error: 'GOOGLE_CLIENT_ID not configured' })
  }

  // Build the OAuth redirect URI — must match exactly what's in Google Cloud Console
  const redirectUri = `${process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://dealflow-zeta.vercel.app'}/api/google-callback`

  // State param carries userId and the page to return to after OAuth
  const state = Buffer.from(JSON.stringify({ userId, returnTo })).toString('base64url')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',         // force refresh_token issuance every time
    state,
  })

  return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`)
}
