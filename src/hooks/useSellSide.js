import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

export function useMandates() {
  const { user, isLoaded } = useUser()
  const [mandates, setMandates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('sell_mandates').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setMandates(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!isLoaded) return
    if (user) fetch()
    else setLoading(false)
  }, [fetch, user, isLoaded])

  const addMandate = async (data) => {
    const { data: row, error } = await supabase.from('sell_mandates').insert([{ ...data, user_id: user.id }]).select().single()
    if (error) throw error
    setMandates(prev => [row, ...prev])
    return row
  }

  const updateMandate = async (id, updates) => {
    const { data: row, error } = await supabase.from('sell_mandates').update(updates).eq('id', id).eq('user_id', user.id).select().single()
    if (error) throw error
    setMandates(prev => prev.map(m => m.id === id ? row : m))
    return row
  }

  const deleteMandate = async (id) => {
    await supabase.from('sell_mandates').delete().eq('id', id).eq('user_id', user.id)
    setMandates(prev => prev.filter(m => m.id !== id))
  }

  return { mandates, loading, addMandate, updateMandate, deleteMandate, refetch: fetch }
}

export function useBuyers(mandateId) {
  const { user } = useUser()
  const [buyers, setBuyers] = useState([])

  const fetch = useCallback(async () => {
    if (!user || !mandateId) { setBuyers([]); return }
    const { data } = await supabase.from('sell_buyers').select('*').eq('mandate_id', mandateId).order('created_at')
    setBuyers(data || [])
  }, [user, mandateId])

  useEffect(() => { fetch() }, [fetch])

  const addBuyer = async (data) => {
    const { data: row, error } = await supabase.from('sell_buyers').insert([{ ...data, mandate_id: mandateId, user_id: user.id }]).select().single()
    if (error) throw error
    setBuyers(prev => [...prev, row])
    return row
  }

  const updateBuyer = async (id, updates) => {
    const { data: row, error } = await supabase.from('sell_buyers').update(updates).eq('id', id).select().single()
    if (error) throw error
    setBuyers(prev => prev.map(b => b.id === id ? row : b))
    return row
  }

  const deleteBuyer = async (id) => {
    await supabase.from('sell_buyers').delete().eq('id', id)
    setBuyers(prev => prev.filter(b => b.id !== id))
  }

  return { buyers, addBuyer, updateBuyer, deleteBuyer, refetch: fetch }
}

export function useBids(mandateId) {
  const { user } = useUser()
  const [bids, setBids] = useState([])

  const fetch = useCallback(async () => {
    if (!user || !mandateId) { setBids([]); return }
    const { data } = await supabase.from('sell_bids').select('*').eq('mandate_id', mandateId).order('amount', { ascending: false })
    setBids(data || [])
  }, [user, mandateId])

  useEffect(() => { fetch() }, [fetch])

  const addBid = async (data) => {
    const { data: row, error } = await supabase.from('sell_bids').insert([{ ...data, mandate_id: mandateId, user_id: user.id }]).select().single()
    if (error) throw error
    setBids(prev => [...prev, row].sort((a, b) => (b.amount || 0) - (a.amount || 0)))
    return row
  }

  const updateBid = async (id, updates) => {
    const { data: row, error } = await supabase.from('sell_bids').update(updates).eq('id', id).select().single()
    if (error) throw error
    setBids(prev => prev.map(b => b.id === id ? row : b).sort((a, b) => (b.amount || 0) - (a.amount || 0)))
    return row
  }

  const deleteBid = async (id) => {
    await supabase.from('sell_bids').delete().eq('id', id)
    setBids(prev => prev.filter(b => b.id !== id))
  }

  return { bids, addBid, updateBid, deleteBid, refetch: fetch }
}
