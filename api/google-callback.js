/**
 * api/google-callback.js
 * Handles the OAuth callback from Google. Exchanges the authorization code
 * for access + refresh tokens, stores them in Supabase, then redirects
 * the user back to the page they came from.
 */
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { code, state, error: oauthError } = req.query

  if (oauthError) {
    return res.redirect(302, `/?error=google_auth_denied`)
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state parameter' })
  }

  // Decode state
  let userId, returnTo
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    userId = decoded.userId
    returnTo = decoded.returnTo || '/'
  } catch {
    return res.status(400).json({ error: 'Invalid state parameter' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Google OAuth credentials not configured' })
  }

  // Build the same redirect URI used in google-auth.js
  const redirectUri = `${process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://dealflow-zeta.vercel.app'}/api/google-callback`

  try {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokens = await tokenRes.json()

    if (tokens.error) {
      console.error('Google token exchange error:', tokens)
      return res.redirect(302, `${returnTo}?error=google_token_failed`)
    }

    // Store tokens in Supabase (upsert on user_id)
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

    // Redirect back to the deal page
    return res.redirect(302, `${returnTo}?google_auth=success`)
  } catch (err) {
    console.error('Google callback error:', err)
    return res.redirect(302, `${returnTo}?error=google_auth_error`)
  }
}
