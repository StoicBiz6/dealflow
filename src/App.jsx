import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
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


function MainView() {
  const navigate = useNavigate()
  const location = useLocation()
  // Persist active view in the URL query string so refresh stays on the same view
  const VALID_VIEWS = ['dashboard', 'pipeline', 'list', 'timeline', 'tasks', 'news']
  const viewFromUrl = new URLSearchParams(location.search).get('view')
  const [view, setViewState] = useState(VALID_VIEWS.includes(viewFromUrl) ? viewFromUrl : 'dashboard')
  const setView = (v) => {
    setViewState(v)
    navigate(`/raise?view=${v}`, { replace: true })
  }
  const [modalDeal, setModalDeal] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showWorkspace, setShowWorkspace] = useState(false)
  const { workspaces, activeWorkspace, loading: wsLoading, userId, switchWorkspace, loadMembers, createWorkspace, joinWorkspace, leaveWorkspace } = useWorkspace()
  const workspaceId = activeWorkspace?.id ?? null
  const { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch } = useDeals(wsLoading ? undefined : workspaceId)
  useEffect(() => {
    if (location.pathname === '/raise') refetch()
  }, [location.pathname])
  const pendingTaskCount = deals.reduce((s, d) => s + (d.tasks || []).filter(t => !t.done).length, 0)
  const handleUpdateDealTasks = (dealId, tasks) => updateDeal(dealId, { tasks })
  const openModal = (deal = null) => setModalDeal(deal || {})
  const closeModal = () => setModalDeal(null)
  const handleSave = async (data) => { if (data.id) { await updateDeal(data.id, data) } else { await addDeal(data) } closeModal() }
  const openDeal = (deal) => navigate(`/deal/${deal.id}`)
  const views = { pipeline: <KanbanView deals={deals} loading={loading} onEdit={openModal} onOpenDeal={openDeal} onStageChange={updateStage} />, dashboard: <DashboardView deals={deals} loading={loading} onOpenDeal={openDeal} />, list: <ListView deals={deals} loading={loading} onEdit={openModal} />, timeline: <TimelineView deals={deals} loading={loading} onOpenDeal={openDeal} />, tasks: <TasksView deals={deals} loading={loading} onUpdateTasks={handleUpdateDealTasks} />, news: <NewsView />, dealroom: <DealRoomView /> }
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
          <Route path="/deal-room/:id" element={<DealRoomView />} />
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