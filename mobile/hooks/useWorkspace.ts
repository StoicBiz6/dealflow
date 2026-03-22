import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";
import { supabase } from "@/lib/supabase";

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  invite_code: string;
}

const STORAGE_KEY = "df_workspace";

export function useWorkspace() {
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("workspace_members")
        .select("workspace_id, workspaces(*)")
        .eq("user_id", user.id);

      const ws = (data || [])
        .map((m: Record<string, unknown>) => m.workspaces as Workspace)
        .filter(Boolean);
      setWorkspaces(ws);

      const stored = await SecureStore.getItemAsync(STORAGE_KEY);
      if (stored && ws.find((w) => w.id === stored)) {
        setActiveWorkspaceIdState(stored);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  const setActiveWorkspace = useCallback(async (id: string | null) => {
    setActiveWorkspaceIdState(id);
    if (id) {
      await SecureStore.setItemAsync(STORAGE_KEY, id);
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    }
  }, []);

  const createWorkspace = useCallback(
    async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .insert({ name, owner_id: user.id, invite_code: inviteCode })
        .select()
        .single();

      if (wsErr) throw wsErr;

      await supabase
        .from("workspace_members")
        .insert({ workspace_id: ws.id, user_id: user.id });

      const newWs = ws as Workspace;
      setWorkspaces((prev) => [...prev, newWs]);
      setActiveWorkspaceIdState(newWs.id);
      await SecureStore.setItemAsync(STORAGE_KEY, newWs.id);
      return newWs;
    },
    [user]
  );

  const joinWorkspace = useCallback(
    async (code: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("*")
        .eq("invite_code", code.toUpperCase().trim())
        .single();

      if (wsErr || !ws) throw new Error("Invalid invite code");

      const { error: memberErr } = await supabase
        .from("workspace_members")
        .insert({ workspace_id: ws.id, user_id: user.id });

      // Ignore duplicate member errors
      if (memberErr && !memberErr.message.includes("duplicate")) {
        throw memberErr;
      }

      await loadWorkspaces();
      setActiveWorkspaceIdState(ws.id);
      await SecureStore.setItemAsync(STORAGE_KEY, ws.id);
      return ws as Workspace;
    },
    [user, loadWorkspaces]
  );

  return {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    joinWorkspace,
    loading,
    refetch: loadWorkspaces,
  };
}
