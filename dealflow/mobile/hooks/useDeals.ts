import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { supabase } from "@/lib/supabase";
import { STAGE_CHECKLISTS } from "@/lib/constants";
import type { Deal } from "@/types/deal";

export function useDeals(workspaceId?: string | null) {
  const { user } = useUser();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("deals")
        .select("*")
        .order("updated_at", { ascending: false });

      if (workspaceId) {
        query = query.eq("workspace_id", workspaceId);
      } else {
        query = query.eq("user_id", user.id).is("workspace_id", null);
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setDeals(data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, [user, workspaceId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const updateDeal = useCallback(
    async (id: string, updates: Partial<Deal>) => {
      const { data, error: err } = await supabase
        .from("deals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (err) throw err;
      setDeals((prev) => prev.map((d) => (d.id === id ? data : d)));
      return data as Deal;
    },
    []
  );

  const addDeal = useCallback(
    async (deal: Partial<Deal>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error: err } = await supabase
        .from("deals")
        .insert({
          ...deal,
          user_id: user.id,
          workspace_id: workspaceId || null,
          stage: deal.stage || "Sourced",
        })
        .select()
        .single();

      if (err) throw err;
      setDeals((prev) => [data as Deal, ...prev]);
      return data as Deal;
    },
    [user, workspaceId]
  );

  const deleteDeal = useCallback(async (id: string) => {
    const { error: err } = await supabase.from("deals").delete().eq("id", id);
    if (err) throw err;
    setDeals((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateStage = useCallback(
    async (id: string, stage: string) => {
      const deal = deals.find((d) => d.id === id);
      if (!deal) throw new Error("Deal not found");

      // Auto-add checklist tasks for the new stage (matching web app logic)
      const stageKey = stage as keyof typeof STAGE_CHECKLISTS;
      const checklistItems = STAGE_CHECKLISTS[stageKey] || [];
      const existingTexts = (deal.tasks || []).map((t) =>
        t.text.toLowerCase()
      );
      const newTasks = checklistItems
        .filter((text) => !existingTexts.includes(text.toLowerCase()))
        .map((text) => ({
          id: `${Date.now()}-${Math.random()}`,
          text,
          done: false,
        }));

      const tasks =
        newTasks.length > 0
          ? [...(deal.tasks || []), ...newTasks]
          : deal.tasks;

      return updateDeal(id, { stage, tasks });
    },
    [deals, updateDeal]
  );

  return {
    deals,
    loading,
    error,
    refetch: fetchDeals,
    updateDeal,
    addDeal,
    deleteDeal,
    updateStage,
  };
}
