import { useState } from 'react'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import DealModal from './components/DealModal'
import DealDetailPanel from './components/DealDetailPanel'
import KanbanView from './views/KanbanView'
import DashboardView from './views/DashboardView'
import ListView from './views/ListView'
import { useDeals } from './hooks/useDeals'
import DealChat from './components/DealChat'

export default function App() {
  const [view, setView] = useState('pipeline')
  const [modalDeal, setModalDeal] = useState(null)   // null = closed, {} = new, {id,...} = edit
  const [detailDeal, setDetailDeal] = useState(null) // null = closed, {id,...} = viewing
  const { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage } = useDeals()

  const openAdd = () => setModalDeal({})
  const openDetail = (deal) => setDetailDeal(deal)
  const closeDetail = () => setDetailDeal(null)
  const openEditFromDetail = () => { setModalDeal(detailDeal); setDetailDeal(null) }
  const closeModal = () => setModalDeal(null)

  const handleSave = async (data) => {
    try {
      if (data.id) {
        const updated = await updateDeal(data.id, data)
        // Re-open detail panel with updated deal
        setDetailDeal(updated)
      } else {
        await addDeal(data)
      }
      closeModal()
    } catch (e) {
      alert('Error saving deal: ' + e.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this deal?')) return
    try {
      await deleteDeal(id)
      closeDetail()
    } catch (e) {
      alert('Error deleting deal: ' + e.message)
    }
  }

  // Keep detailDeal in sync with latest deals data
  const currentDetailDeal = detailDeal ? (deals.find(d => d.id === detailDeal.id) || detailDeal) : null

  return (
    <>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
      <SignedIn>
        <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>
          <Navbar view={view} setView={setView} onAddDeal={openAdd} />

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
              {view === 'pipeline' && (
                <KanbanView
                  deals={deals}
                  onEdit={openDetail}
                  onDelete={handleDelete}
                  onStageChange={updateStage}
                />
              )}
              {view === 'dashboard' && <DashboardView deals={deals} onOpenDeal={openDetail} />}
              {view === 'list' && (
                <ListView
                  deals={deals}
                  onEdit={openDetail}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}

          <DealChat onCreateDeal={addDeal} />

          {currentDetailDeal && (
            <DealDetailPanel
              deal={currentDetailDeal}
              onClose={closeDetail}
              onEdit={openEditFromDetail}
              onUpdate={updateDeal}
            />
          )}

          {modalDeal !== null && (
            <DealModal
              deal={modalDeal}
              onSave={handleSave}
              onClose={closeModal}
            />
          )}
        </div>
      </SignedIn>
    </>
  )
}
