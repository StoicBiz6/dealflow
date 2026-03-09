import { useState, useEffect, useCallback } from 'react'
import { useSession, useUser } from '@clerk/clerk-react'
import { getAuthClient } from '../lib/supabase'

export function useDeals() {
  const { session } = useSession()
  const { user } = useUser()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Returns a Supabase client authenticated with the current Clerk session
  const getClient = useCallback(async () => {
    const token = await session.getToken({ template: 'supabase' })
    return getAuthClient(token)
  }, [session])

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    try {
      const client = await getClient()
      const { data, error } = await client
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setDeals(data || [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [getClient])

  useEffect(() => {
    if (session && user) fetchDeals()
  }, [fetchDeals, session, user])

  const addDeal = async (deal) => {
    const client = await getClient()
    const { data, error } = await client
      .from('deals')
      .insert([{ ...deal, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setDeals(prev => [data, ...prev])
    return data
  }

  const updateDeal = async (id, updates) => {
    const client = await getClient()
    const { data, error } = await client
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setDeals(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  const deleteDeal = async (id) => {
    const client = await getClient()
    const { error } = await client.from('deals').delete().eq('id', id)
    if (error) throw error
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const updateStage = async (id, stage) => {
    return updateDeal(id, { stage })
  }

  return { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch: fetchDeals }
}
