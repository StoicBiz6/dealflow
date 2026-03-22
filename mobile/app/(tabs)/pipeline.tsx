import { useRouter } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeals } from "@/hooks/useDeals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { STAGES, STAGE_COLORS, formatCurrency } from "@/lib/constants";
import type { Deal } from "@/types/deal";

const PIPELINE_STAGES = STAGES.filter((s) => s !== "Passed");

export default function PipelineScreen() {
  const { activeWorkspaceId } = useWorkspace();
  const { deals, loading, refetch } = useDeals(activeWorkspaceId);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filteredDeals = selectedStage
    ? deals.filter((d) => d.stage === selectedStage)
    : deals;

  return (
    <View className="flex-1 bg-slate-900">
      {/* Stage filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="border-b border-slate-800 max-h-14"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          gap: 8,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={() => setSelectedStage(null)}
          className={`px-4 py-1.5 rounded-full ${!selectedStage ? "bg-blue-600" : "bg-slate-800"}`}
        >
          <Text
            className={
              !selectedStage ? "text-white text-sm" : "text-slate-400 text-sm"
            }
          >
            All ({deals.length})
          </Text>
        </Pressable>

        {PIPELINE_STAGES.map((stage) => {
          const count = deals.filter((d) => d.stage === stage).length;
          if (count === 0) return null;
          const isActive = selectedStage === stage;
          return (
            <Pressable
              key={stage}
              onPress={() => setSelectedStage(isActive ? null : stage)}
              className={`px-4 py-1.5 rounded-full ${isActive ? "bg-blue-600" : "bg-slate-800"}`}
            >
              <Text
                className={
                  isActive ? "text-white text-sm" : "text-slate-400 text-sm"
                }
              >
                {stage} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={filteredDeals}
        keyExtractor={(d) => d.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: insets.bottom + 16,
        }}
        renderItem={({ item }) => (
          <DealCard
            deal={item}
            onPress={() => router.push(`/deal/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-slate-400 text-base">No deals found</Text>
            <Text className="text-slate-600 text-sm mt-1">
              Add deals from the web app
            </Text>
          </View>
        }
      />
    </View>
  );
}

function DealCard({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const color =
    STAGE_COLORS[deal.stage as keyof typeof STAGE_COLORS] ?? "#64748b";
  const fee =
    deal.raise_amount && deal.fee_pct
      ? (deal.raise_amount * deal.fee_pct) / 100
      : null;
  const pendingTasks = (deal.tasks || []).filter((t) => !t.done).length;

  return (
    <Pressable
      onPress={onPress}
      className="bg-slate-800 rounded-2xl p-4 active:opacity-80"
    >
      <View className="flex-row justify-between items-start mb-3">
        <Text
          className="text-white font-semibold text-base flex-1 mr-3"
          numberOfLines={1}
        >
          {deal.company_name}
        </Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: color + "20" }}
        >
          <Text className="text-xs font-medium" style={{ color }}>
            {deal.stage}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 flex-wrap">
        {deal.raise_amount ? (
          <InfoChip label="Raise" value={formatCurrency(deal.raise_amount)} />
        ) : null}
        {deal.sector ? (
          <InfoChip label="Sector" value={deal.sector} />
        ) : null}
        {fee ? (
          <InfoChip label="Est. Fee" value={formatCurrency(fee)} green />
        ) : null}
        {pendingTasks > 0 ? (
          <InfoChip label="Tasks" value={`${pendingTasks} open`} amber />
        ) : null}
      </View>
    </Pressable>
  );
}

function InfoChip({
  label,
  value,
  green,
  amber,
}: {
  label: string;
  value: string;
  green?: boolean;
  amber?: boolean;
}) {
  return (
    <View>
      <Text className="text-slate-500 text-xs">{label}</Text>
      <Text
        className={`text-sm font-medium ${green ? "text-green-400" : amber ? "text-amber-400" : "text-white"}`}
      >
        {value}
      </Text>
    </View>
  );
}
