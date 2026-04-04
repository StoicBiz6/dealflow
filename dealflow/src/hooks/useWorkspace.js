import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/clerk-react'
import { supabase } from '../lib/supabase'

export function useWorkspace() {
  const { user } = useUser()
  const [workspaces, setWorkspaces] = useState(undefined) // undefined=loading, array=loaded
  const [activeId, setActiveId] = useState(() => localStorage.getItem('df_workspace') || null)

  // Upsert current user's profile so teammates can see their name/avatar
  useEffect(() => {
    if (!user) return
    supabase.from('profiles').upsert({
      user_id: user.id,
      full_name: user.fullName || user.firstName || user.username || 'Unknown',
      email: user.primaryEmailAddress?.emailAddress || '',
      avatar_url: user.imageUrl || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
  }, [user?.id])

  const load = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('workspace_members')
      .select('role, joined_at, workspaces(*)')
      .eq('user_id', user.id)

    if (data) {
      const ws = data.map(d => ({ ...d.workspaces, role: d.role }))
      setWorkspaces(ws)
      // If saved activeId is no longer valid, clear it
      if (activeId && !ws.find(w => w.id === activeId)) {
        setActiveId(null)
        localStorage.removeItem('df_workspace')
      }
    } else {
      setWorkspaces([])
    }
  }, [user]) // intentionally exclude activeId to avoid re-render loop

  useEffect(() => { load() }, [load])

  const activeWorkspace = workspaces?.find(w => w.id === activeId) || null

  const switchWorkspace = (id) => {
    setActiveId(id)
    if (id) localStorage.setItem('df_workspace', id)
    else localStorage.removeItem('df_workspace')
  }

  const loadMembers = async (workspaceId) => {
    const { data: members } = await supabase
      .from('workspace_members')
      .select('user_id, role, joined_at')
      .eq('workspace_id', workspaceId)

    if (!members?.length) return []

    const userIds = members.map(m => m.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, avatar_url')
      .in('user_id', userIds)

    const profileMap = {}
    profiles?.forEach(p => { profileMap[p.user_id] = p })

    return members.map(m => ({ ...m, profile: profileMap[m.user_id] || null }))
  }

  const createWorkspace = async (name) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: ws, error } = await supabase
      .from('workspaces')
      .insert({ name, owner_id: user.id, invite_code: inviteCode })
      .select()
      .single()
    if (error) throw error

    await supabase.from('workspace_members').insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'owner',
    })

    await load()
    switchWorkspace(ws.id)
    return ws
  }

  const joinWorkspace = async (code) => {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('*')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle()

    if (!ws) throw new Error('Invalid invite code — double check and try again')

    const { error } = await supabase.from('workspace_members').upsert(
      { workspace_id: ws.id, user_id: user.id, role: 'member' },
      { onConflict: 'workspace_id,user_id' }
    )
    if (error) throw error
    await load()
    switchWorkspace(ws.id)
    return ws
  }

  const leaveWorkspace = async (workspaceId) => {
    await supabase.from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
    if (activeId === workspaceId) switchWorkspace(null)
    await load()
  }

  return {
    workspaces: workspaces || [],
    activeWorkspace,
    loading: workspaces === undefined,
    userId: user?.id,
    switchWorkspace,
    loadMembers,
    createWorkspace,
    joinWorkspace,
    leaveWorkspace,
    reload: load,
  }
}
