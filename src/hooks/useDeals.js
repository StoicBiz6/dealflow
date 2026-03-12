import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

export function useDeals(workspaceId = null) {
  const { user, isLoaded } = useUser()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeals = useCallback(async () => {
    if (!user) return
    setDeals([])
    setLoading(true)

    let q = supabase.from('deals').select('*').order('created_at', { ascending: false })

    if (workspaceId) {
      // Workspace mode: fetch all deals for this workspace
      q = q.eq('workspace_id', workspaceId)
    } else {
      // Personal mode: fetch deals owned by user with no workspace
      q = q.eq('user_id', user.id).is('workspace_id', null)
    }

    const { data, error } = await q
    if (error) setError(error.message)
    else setDeals(data || [])
    setLoading(false)
  }, [user, workspaceId])

  useEffect(() => {
    if (!isLoaded) return           // Clerk still restoring session, wait
    if (user) fetchDeals()
    else setLoading(false)          // signed out, nothing to load
  }, [fetchDeals, user, isLoaded])

  const addDeal = async (deal) => {
    const payload = workspaceId
      ? { ...deal, workspace_id: workspaceId, user_id: user.id }
      : { ...deal, user_id: user.id }

    const { data, error } = await supabase
      .from('deals')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    setDeals(prev => [data, ...prev])
    return data
  }

  const updateDeal = async (id, updates) => {
    let q = supabase.from('deals').update(updates).eq('id', id)
    // In personal mode, ensure ownership; in workspace mode any member can edit
    if (!workspaceId) q = q.eq('user_id', user.id)

    const { data, error } = await q.select().single()
    if (error) throw error
    setDeals(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  const deleteDeal = async (id) => {
    let q = supabase.from('deals').delete().eq('id', id)
    if (!workspaceId) q = q.eq('user_id', user.id)

    const { error } = await q
    if (error) throw error
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const updateStage = async (id, stage) => updateDeal(id, { stage })

  return { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch: fetchDeals }
}
