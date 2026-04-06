import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeals } from "@/hooks/useDeals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { ACTIVE_STAGES, STAGE_COLORS, formatCurrency } from "@/lib/constants";
import type { Deal } from "@/types/deal";

function isStale(deal: Deal): boolean {
  const ms = Date.now() - new Date(deal.updated_at).getTime();
  return ms / (1000 * 60 * 60 * 24) > 14;
}

export default function DashboardScreen() {
  const { user } = useUser();
  const { activeWorkspaceId } = useWorkspace();
  const { deals, loading, error, refetch } = useDeals(activeWorkspaceId);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const active = deals.filter((d) =>
      ACTIVE_STAGES.includes(d.stage as (typeof ACTIVE_STAGES)[number])
    );
    const closed = deals.filter((d) => d.stage === "Closed");
    const totalRaise = active.reduce((s, d) => s + (d.raise_amount || 0), 0);
    const totalFees = active.reduce(
      (s, d) => s + (d.raise_amount || 0) * ((d.fee_pct || 2) / 100),
      0
    );
    const totalRetainer = active.reduce((s, d) => s + (d.monthly_retainer || 0), 0);
    const stale = active.filter(isStale);
    const feePipeline = [...active]
      .filter((d) => d.raise_amount)
      .sort(
        (a, b) =>
          (b.raise_amount || 0) * ((b.fee_pct || 2) / 100) -
          (a.raise_amount || 0) * ((a.fee_pct || 2) / 100)
      )
      .slice(0, 6);

    const byStage = ACTIVE_STAGES.map((stage) => {
      const stageDeals = active.filter((d) => d.stage === stage);
      const raise = stageDeals.reduce((s, d) => s + (d.raise_amount || 0), 0);
      return { stage, count: stageDeals.length, raise };
    }).filter((s) => s.count > 0);

    return {
      active: active.length,
      closed: closed.length,
      totalRaise,
      totalFees,
      totalRetainer,
      stale,
      feePipeline,
      byStage,
    };
  }, [deals]);

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      refreshControl={
        <RefreshControl
          refreshing={loading && deals.length > 0}
          onRefresh={refetch}
          tintColor="#3b82f6"
        />
      }
    >
      <View className="mb-6">
        <Text className="text-slate-400 text-sm">Welcome back</Text>
        <Text className="text-white text-2xl font-bold">
          {user?.firstName ?? "Dealflow"}
        </Text>
      </View>

      {/* Error state */}
      {error && !loading && (
        <View className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex-row items-center gap-3">
          <Ionicons name="alert-circle-outline" size={20} color="#f87171" />
          <View className="flex-1">
            <Text className="text-red-400 font-medium text-sm">
              Failed to load deals
            </Text>
            <Text className="text-red-400/70 text-xs mt-0.5">{error}</Text>
          </View>
          <TouchableOpacity onPress={refetch}>
            <Text className="text-blue-400 text-sm">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Initial loading state */}
      {loading && deals.length === 0 ? (
        <View className="py-20 items-center gap-3">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-500 text-sm">Loading deals...</Text>
        </View>
      ) : deals.length === 0 && !loading ? (
        /* Empty state */
        <View className="py-16 items-center px-6">
          <View className="w-16 h-16 rounded-full bg-blue-600/10 items-center justify-center mb-4">
            <Ionicons name="briefcase-outline" size={32} color="#3b82f6" />
          </View>
          <Text className="text-white text-lg font-semibold mb-2">
            No deals yet
          </Text>
          <Text className="text-slate-400 text-sm text-center mb-6">
            Start tracking your deals. Tap the Pipeline tab and hit + to add
            your first deal.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/pipeline")}
            className="bg-blue-600 rounded-xl px-6 py-3 flex-row items-center gap-2"
          >
            <Ionicons name="add" size={18} color="white" />
            <Text className="text-white font-semibold">Add First Deal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* KPI Grid */}
          <View className="flex-row gap-3 mb-3">
            <KPICard label="Active Deals" value={String(stats.active)} />
            <KPICard
              label="Total Raise"
              value={formatCurrency(stats.totalRaise)}
            />
          </View>
          <View className="flex-row gap-3 mb-3">
            <KPICard
              label="Est. Success Fees"
              value={formatCurrency(stats.totalFees)}
              accent
            />
            <KPICard label="Closed" value={String(stats.closed)} />
          </View>
          {stats.totalRetainer > 0 && (
            <View className="flex-row gap-3 mb-6">
              <KPICard
                label="Monthly Retainer"
                value={formatCurrency(stats.totalRetainer) + "/mo"}
                accent
              />
            </View>
          )}

          {/* Stale Deals Alert */}
          {stats.stale.length > 0 && (
            <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
              <Text className="text-amber-400 font-semibold mb-3">
                ⚠ {stats.stale.length} Stale Deal
                {stats.stale.length > 1 ? "s" : ""} (14+ days)
              </Text>
              {stats.stale.map((deal) => (
                <TouchableOpacity
                  key={deal.id}
                  onPress={() => router.push(`/deal/${deal.id}`)}
                  className="flex-row justify-between items-center py-2.5 border-b border-amber-500/20 last:border-0"
                >
                  <Text className="text-white font-medium">
                    {deal.company_name}
                  </Text>
                  <Text className="text-amber-400 text-xs">{deal.stage}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Fee Pipeline */}
          {stats.feePipeline.length > 0 && (
            <View className="bg-slate-800 rounded-2xl p-4 mb-6">
              <Text className="text-white font-semibold mb-4">
                Fee Pipeline
              </Text>
              {stats.feePipeline.map((deal) => {
                const fee =
                  (deal.raise_amount || 0) * ((deal.fee_pct || 2) / 100);
                const color =
                  STAGE_COLORS[deal.stage as keyof typeof STAGE_COLORS] ??
                  "#64748b";
                return (
                  <TouchableOpacity
                    key={deal.id}
                    onPress={() => router.push(`/deal/${deal.id}`)}
                    className="flex-row justify-between items-center py-3 border-b border-slate-700 last:border-0"
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className="text-white font-medium"
                        numberOfLines={1}
                      >
                        {deal.company_name}
                      </Text>
                      <View
                        className="rounded-full px-2 py-0.5 self-start mt-1"
                        style={{ backgroundColor: color + "20" }}
                      >
                        <Text className="text-xs" style={{ color }}>
                          {deal.stage}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-green-400 font-semibold">
                        {formatCurrency(fee)}
                      </Text>
                      {deal.monthly_retainer ? (
                        <Text className="text-blue-400 text-xs">
                          +{formatCurrency(deal.monthly_retainer)}/mo
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* By Stage */}
          {stats.byStage.length > 0 && (
            <View className="bg-slate-800 rounded-2xl p-4">
              <Text className="text-white font-semibold mb-4">By Stage</Text>
              {stats.byStage.map(({ stage, count, raise }) => {
                const color =
                  STAGE_COLORS[stage as keyof typeof STAGE_COLORS] ?? "#64748b";
                return (
                  <View
                    key={stage}
                    className="flex-row items-center justify-between py-2.5 border-b border-slate-700 last:border-0"
                  >
                    <View className="flex-row items-center gap-2">
                      <View
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <Text className="text-slate-300 text-sm">{stage}</Text>
                    </View>
                    <View className="flex-row items-center gap-3">
                      <Text className="text-slate-400 text-sm">
                        {count} deal{count > 1 ? "s" : ""}
                      </Text>
                      <Text className="text-white text-sm font-medium">
                        {formatCurrency(raise)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function KPICard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View
      className={`flex-1 rounded-2xl p-4 ${accent ? "bg-blue-600" : "bg-slate-800"}`}
    >
      <Text
        className={`text-xs mb-1 font-medium ${accent ? "text-blue-100" : "text-slate-400"}`}
      >
        {label}
      </Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
    </View>
  );
}
