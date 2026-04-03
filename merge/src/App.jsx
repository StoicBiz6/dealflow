import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'

// ── Existing capital-raise app (unchanged) ──────────────────────────────────
import LandingPage from './LandingPage'

// ── New: mode selector + sell-side ─────────────────────────────────────────
import ModeSelectorPage from './pages/ModeSelectorPage'
import SellShell from './components/sell-side/SellShell'
import SSDashboard from './views/sell-side/SSDashboard'
import SSProcesses from './views/sell-side/SSProcesses'
import SSBuyers    from './views/sell-side/SSBuyers'
import SSBids      from './views/sell-side/SSBids'
import SSDataRoom  from './views/sell-side/SSDataRoom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <BrowserRouter>
        <Routes>
          {/* ── Mode selector (post-login landing) ─────────────────────── */}
          <Route
            path="/select"
            element={
              <>
                <SignedIn><ModeSelectorPage /></SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            }
          />

          {/* ── Sell-side platform ─────────────────────────────────────── */}
          <Route
            path="/sell/*"
            element={
              <>
                <SignedIn>
                  <SellShell>
                    <Routes>
                      <Route path="/"         element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<SSDashboard />} />
                      <Route path="processes" element={<SSProcesses />} />
                      <Route path="buyers"    element={<SSBuyers />}    />
                      <Route path="bids"      element={<SSBids />}      />
                      <Route path="dataroom"  element={<SSDataRoom />}  />
                    </Routes>
                  </SellShell>
                </SignedIn>
                <SignedOut><RedirectToSignIn /></SignedOut>
              </>
            }
          />

          {/* ── Existing capital-raise app (all existing routes untouched) */}
          <Route path="/*" element={<LandingPage />} />
        </Routes>
      </BrowserRouter>
    </ClerkProvider>
  )
}
