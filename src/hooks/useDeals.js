import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setDeals(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const addDeal = async (deal) => {
    const { data, error } = await supabase.from('deals').insert([deal]).select().single()
    if (error) throw error
    setDeals(prev => [data, ...prev])
    return data
  }

  const updateDeal = async (id, updates) => {
    const { data, error } = await supabase.from('deals').update(updates).eq('id', id).select().single()
    if (error) throw error
    setDeals(prev => prev.map(d => d.id === id ? data : d))
    return data
  }

  const deleteDeal = async (id) => {
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) throw error
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  const updateStage = async (id, stage) => {
    return updateDeal(id, { stage })
  }

  return { deals, loading, error, addDeal, updateDeal, deleteDeal, updateStage, refetch: fetchDeals }
}
