import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

export function useDeals() {
  const { user } = useUser()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setDeals(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { if (user) fetchDeals() }, [fetchDeals, user])

  const addDeal = async (deal) => {
    const { data, error } = await supabase
      .from('deals')
      .insert([{ ...deal, user_id: user.id }])
      .select()
      .single()
    if (error) throw error
    setDeals(prev => [data, ...prev])
    return data
  }

  const updateDeal = async (id, updates) => {
    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (error) throw error
    setDeals(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  const deleteDeal = async (id) => {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const updateStage = async (id, stage) => {
    return updateDeal(id, { stage })
  }

  return { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch: fetchDeals }
}
