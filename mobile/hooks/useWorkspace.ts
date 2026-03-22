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

  return {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    loading,
    refetch: loadWorkspaces,
  };
}
