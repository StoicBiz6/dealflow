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
import { useDeals } from './hooks/useDeals'
import { useWorkspace } from './hooks/useWorkspace'
import DealChat from './components/DealChat'

function MainView() {
  const [view, setView] = useState('pipeline')
  const [modalDeal, setModalDeal] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showWorkspace, setShowWorkspace] = useState(false)

  // Workspace â€” load first
  const { workspaces, activeWorkspace, loading: wsLoading, userId, switchWorkspace, loadMembers, createWorkspace, joinWorkspace, leaveWorkspace } = useWorkspace()

  // Deals â€” pass workspace id so queries scope correctly
  const workspaceId = activeWorkspace?.id ?? null
  const { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch } = useDeals(wsLoading ? undefined : workspaceId)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/') refetch()
  }, [location.pathname])

  // Pending task count for badge
  const pendingTaskCount = deals.reduce((s, d) => s + (d.tasks || []).filter(t => !t.done).length, 0)

  // Update tasks on a specific deal (used by TasksView)
  const handleUpdateDealTasks = (dealId, tasks) => updateDeal(dealId, { tasks })

  const openAdd = () => setModalDeal({})
  const openDeal = (deal) => navigate(`/deal/${deal.id}`)
  const closeModal = () => setModalDeal(null)

  const handleSave = async (data) => {
    try {
      if (data.id) await updateDeal(data.id, data)
      else await addDeal(data)
      closeModal()
    } catch (e) {
      alert('Error saving deal: ' + e.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this deal?')) return
    try { await deleteDeal(id) }
    catch (e) { alert('Error deleting deal: ' + e.message) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Navbar
        view={view}
        setView={setView}
        onAddDeal={openAdd}
        onImport={() => setShowImport(true)}
        activeWorkspace={activeWorkspace}
        onWorkspace={() => setShowWorkspace(true)}
        taskCount={pendingTaskCount}
      />

      {(loading || wsLoading) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', color: '#555', fontSize: '12px' }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', color: '#f87171', fontSize: '12px' }}>
          Error: {error}
        </div>
      )}

      {!loading && !wsLoading && !error && (
        <>
          {view === 'pipeline' && <KanbanView deals={deals} onEdit={openDeal} onDelete={handleDelete} onStageChange={updateStage} />}
          {view === 'dashboard' && <DashboardView deals={deals} onOpenDeal={openDeal} />}
          {view === 'list' && <ListView deals={deals} onEdit={openDeal} onDelete={handleDelete} />}
          {view === 'timeline' && <TimelineView deals={deals} onOpenDeal={openDeal} />}
          {view === 'tasks' && <TasksView deals={deals} onUpdateDealTasks={handleUpdateDealTasks} onOpenDeal={openDeal} />}
          {view === 'news' && <NewsView deals={deals} />}
        </>
      )}

      <DealChat onCreateDeal={addDeal} />

      {modalDeal !== null && (
        <DealModal deal={modalDeal} onSave={handleSave} onClose={closeModal} />
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} addDeal={addDeal} />
      )}

      {showWorkspace && (
        <WorkspaceModal
          workspaces={workspaces}
          activeWorkspace={activeWorkspace}
          onClose={() => setShowWorkspace(false)}
          onSwitch={switchWorkspace}
          onLoadMembers={loadMembers}
          onCreate={createWorkspace}
          onJoin={joinWorkspace}
          onLeave={leaveWorkspace}
          currentUserId={userId}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <SignedOut><LandingPage /></SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
          <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
          <Route path="/deal/:id" element={<DealPage />} />
          <Route path="/deal-room/:id" element={<DealRoomView />} />
        </Routes>
      </SignedIn>
    </>
  )
}
