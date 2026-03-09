import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import DealModal from './components/DealModal'
import ImportModal from './components/ImportModal'
import KanbanView from './views/KanbanView'
import DashboardView from './views/DashboardView'
import ListView from './views/ListView'
import DealPage from './views/DealPage'
import { useDeals } from './hooks/useDeals'
import DealChat from './components/DealChat'

function MainView() {
  const [view, setView] = useState('pipeline')
  const [modalDeal, setModalDeal] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch } = useDeals()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/') refetch()
  }, [location.pathname])

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
      <Navbar view={view} setView={setView} onAddDeal={openAdd} onImport={() => setShowImport(true)} />

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', color: '#555', fontSize: '12px' }}>
          Loading deals...
        </div>
      )}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)', color: '#f87171', fontSize: '12px' }}>
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {view === 'pipeline' && <KanbanView deals={deals} onEdit={openDeal} onDelete={handleDelete} onStageChange={updateStage} />}
          {view === 'dashboard' && <DashboardView deals={deals} onOpenDeal={openDeal} />}
          {view === 'list' && <ListView deals={deals} onEdit={openDeal} onDelete={handleDelete} />}
        </>
      )}

      <DealChat onCreateDeal={addDeal} />

      {modalDeal !== null && (
        <DealModal deal={modalDeal} onSave={handleSave} onClose={closeModal} />
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} addDeal={addDeal} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <SignedOut><RedirectToSignIn /></SignedOut>
      <SignedIn>
        <Routes>
          <Route path="/" element={<MainView />} />
          <Route path="/deal/:id" element={<DealPage />} />
        </Routes>
      </SignedIn>
    </>
  )
}
