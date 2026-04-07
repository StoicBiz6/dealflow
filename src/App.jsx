import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, useSignIn } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import LandingPage from './LandingPage'
import { SignIn, SignUp } from '@clerk/clerk-react'
import DealModal from './components/DealModal'
import ImportModal from './components/ImportModal'
import WorkspaceModal from './components/WorkspaceModal'
import KanbanView from './views/KanbanView'
import DashboardView from './views/DashboardView'
import ListView from './views/ListView'
import TimelineView from './views/TimelineView'
import TasksView from './views/TasksView'
import NewsView from './views/NewsView'
import DealPage from './views/DealPage'
import DealRoomView from './views/DealRoomView'
import ModeSelectorPage from './pages/ModeSelectorPage'
import SellShell from './components/sell-side/SellShell'
import SSDashboard from './views/sell-side/SSDashboard'
import SSProcesses from './views/sell-side/SSProcesses'
import SSBuyers from './views/sell-side/SSBuyers'
import SSBids from './views/sell-side/SSBids'
import SSDataRoom from './views/sell-side/SSDataRoom'
import SSMandateDetail from './views/sell-side/SSMandateDetail'
import { useDeals } from './hooks/useDeals'
import { useWorkspace } from './hooks/useWorkspace'
import DealChat from './components/DealChat'

// Passwordless OTP gate for /deal-room/:id — shown to unauthenticated visitors.
// Step 1: enter invited email → Clerk sends a one-time code.
// Step 2: enter the code → session created, redirect back to this deal room.
function DealRoomGate() {
  const location = useLocation()
  const navigate = useNavigate()
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '10px 14px', color: '#f0f0f0', fontSize: '13px', fontFamily: 'DM Mono, monospace', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const btnStyle = (disabled) => ({ background: '#7c6af7', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontFamily: 'DM Mono, monospace', width: '100%' })

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await signIn.create({ identifier: email.trim().toLowerCase(), strategy: 'email_code' })
      setStep('code')
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Failed to send code. Check the email address.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    if (!isLoaded || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code: code.trim() })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        navigate(location.pathname, { replace: true })
      }
    } catch (err) {
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', fontFamily: 'DM Mono, monospace', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '22px', color: '#f0f0f0', marginBottom: '10px' }}>🔒 Deal Room Access</div>
        <div style={{ color: '#555', fontSize: '13px', lineHeight: 1.6, maxWidth: '360px' }}>
          {step === 'email'
            ? 'Enter the email address you were invited with to receive a sign-in code.'
            : `A 6-digit code was sent to ${email}. Enter it below.`}
        </div>
      </div>

      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '28px 32px', width: '100%', maxWidth: '360px' }}>
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoFocus
              required
              style={inputStyle}
            />
            {error && <div style={{ color: '#f87171', fontSize: '12px' }}>{error}</div>}
            <button type="submit" disabled={submitting || !email} style={btnStyle(submitting || !email)}>
              {submitting ? 'Sending…' : 'Send code →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              autoFocus
              required
              style={{ ...inputStyle, letterSpacing: '0.3em', textAlign: 'center', fontSize: '18px' }}
            />
            {error && <div style={{ color: '#f87171', fontSize: '12px' }}>{error}</div>}
            <button type="submit" disabled={submitting || code.length < 6} style={btnStyle(submitting || code.length < 6)}>
              {submitting ? 'Verifying…' : 'Access deal room →'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              style={{ background: 'none', border: 'none', color: '#444', fontSize: '11px', cursor: 'pointer', fontFamily: 'DM Mono, monospace', marginTop: '4px' }}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function MainView() {
  const [view, setView] = useState('dashboard')
  const [modalDeal, setModalDeal] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const { workspaces, activeWorkspace, loading: wsLoading, userId, switchWorkspace, loadMembers, createWorkspace, joinWorkspace, leaveWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace?.id ?? null
  const { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch } = useDeals(wsLoading ? undefined : workspaceId)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    if (location.pathname === '/') refetch()
  }, [location.pathname])
  const pendingTaskCount = deals.reduce((s, d) => s + (d.tasks || []).filter(t => !t.done).length, 0)
  const handleUpdateDealTasks = (dealId, tasks) => updateDeal(dealId, { tasks })
  const openModal = (deal = null) => setModalDeal(deal || {})
  const closeModal = () => setModalDeal(null)
  const handleSave = async (data) => { if (data.id) { await updateDeal(data.id, data) } else { await addDeal(data) } closeModal() }
  const openDeal = (deal) => navigate(`/deal/${deal.id}`)
  const views = { pipeline: <KanbanView deals={deals} loading={loading} onEdit={openModal} onOpenDeal={openDeal} onStageChange={updateStage} />, dashboard: <DashboardView deals={deals} loading={loading} onOpenDeal={openDeal} />, list: <ListView deals={deals} loading={loading} onEdit={openModal} />, timeline: <TimelineView deals={deals} loading={loading} />, tasks: <TasksView deals={deals} loading={loading} onUpdateTasks={handleUpdateDealTasks} />, news: <NewsView />, dealroom: <DealRoomView /> }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0a0a' }}>
      <Navbar view={view} setView={setView} onAdd={() => openModal()} onImport={() => setShowImport(true)} onWorkspace={() => setShowWorkspace(true)} pendingTaskCount={pendingTaskCount} workspaceName={activeWorkspace?.name} userId={userId} />
      <div style={{ flex: 1, overflow: 'hidden' }}>{views[view] || views.pipeline}</div>
      {modalDeal !== null && (<DealModal deal={modalDeal} onSave={handleSave} onClose={closeModal} />)}
      {showImport && (<ImportModal onClose={() => setShowImport(false)} addDeal={addDeal} />)}
      {showWorkspace && (<WorkspaceModal workspaces={workspaces} activeWorkspace={activeWorkspace} onClose={() => setShowWorkspace(false)} onSwitch={switchWorkspace} onLoadMembers={loadMembers} onCreate={createWorkspace} onJoin={joinWorkspace} onLeave={leaveWorkspace} currentUserId={userId} />)}
    </div>
  )
}

function SelectOrMain() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/select', { replace: true }) }, [])
  return null
}

export default function App() {
  return (
    <>
      <SignedOut>
        <Routes>
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="/deal-room/:id" element={<DealRoomGate />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/select" element={<ModeSelectorPage />} />
          <Route path="/sell/dashboard" element={<SellShell><SSDashboard /></SellShell>} />
          <Route path="/sell/processes" element={<SellShell><SSProcesses /></SellShell>} />
          <Route path="/sell/buyers" element={<SellShell><SSBuyers /></SellShell>} />
          <Route path="/sell/bids" element={<SellShell><SSBids /></SellShell>} />
          <Route path="/sell/dataroom" element={<SellShell><SSDataRoom /></SellShell>} />
          <Route path="/sell/deal/:id" element={<SellShell><SSMandateDetail /></SellShell>} />
          <Route path="/raise" element={<MainView />} />
          <Route path="/deal/:id" element={<DealPage />} />
          <Route path="/deal-room/:id" element={<DealRoomView />} />
          <Route path="*" element={<SelectOrMain />} />
        </Routes>
      </SignedIn>
    </>
  )
}