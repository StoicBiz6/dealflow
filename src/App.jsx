import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import ModeSelectorPage from './pages/ModeSelectorPage'
import SellShell from './components/sell-side/SellShell'
import SSDashboard from './views/sell-side/SSDashboard'
import SSProcesses from './views/sell-side/SSProcesses'
import SSBuyers from './views/sell-side/SSBuyers'
import SSBids from './views/sell-side/SSBids'
import SSDataRoom from './views/sell-side/SSDataRoom'
import LandingPage from './LandingPage'

export default function App() {
  return (
    <Routes>
      <Route path="/select" element={<><SignedIn><ModeSelectorPage /></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
      <Route path="/sell/*" element={<><SignedIn><SellShell><Routes><Route path="/" element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<SSDashboard />} /><Route path="processes" element={<SSProcesses />} /><Route path="buyers" element={<SSBuyers />} /><Route path="bids" element={<SSBids />} /><Route path="dataroom" element={<SSDataRoom />} /></Routes></SellShell></SignedIn><SignedOut><RedirectToSignIn /></SignedOut></>} />
      <Route path="/*" element={<LandingPage />} />
    </Routes>
  )
}