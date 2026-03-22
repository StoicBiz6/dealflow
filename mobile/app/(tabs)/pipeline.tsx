import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeals } from "@/hooks/useDeals";
import { useWorkspace } from "@/hooks/useWorkspace";
import { SECTORS, STAGES, STAGE_COLORS, formatCurrency } from "@/lib/constants";
import type { Deal } from "@/types/deal";

const PIPELINE_STAGES = STAGES.filter((s) => s !== "Passed");

export default function PipelineScreen() {
  const { activeWorkspaceId } = useWorkspace();
  const { deals, loading, refetch, addDeal, deleteDeal } =
    useDeals(activeWorkspaceId);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const filteredDeals = selectedStage
    ? deals.filter((d) => d.stage === selectedStage)
    : deals;

  const handleDelete = (deal: Deal) => {
    Alert.alert(
      "Delete Deal",
      `Delete "${deal.company_name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDeal(deal.id);
            } catch {
              Alert.alert("Error", "Failed to delete deal.");
            }
          },
        },
      ]
    );
  };

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
          paddingBottom: insets.bottom + 80,
        }}
        renderItem={({ item }) => (
          <DealCard
            deal={item}
            onPress={() => router.push(`/deal/${item.id}`)}
            onLongPress={() => handleDelete(item)}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-20">
              <Text className="text-slate-400 text-base">No deals yet</Text>
              <Text className="text-slate-600 text-sm mt-1">
                Tap + to add your first deal
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
        style={{
          bottom: insets.bottom + 16,
          shadowColor: "#3b82f6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <AddDealModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addDeal}
      />
    </View>
  );
}

function AddDealModal({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (deal: Partial<Deal>) => Promise<Deal>;
}) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Sourced");
  const [sector, setSector] = useState("");
  const [raiseStr, setRaiseStr] = useState("");
  const [valStr, setValStr] = useState("");
  const [feeStr, setFeeStr] = useState("2");
  const [owner, setOwner] = useState("");
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const parseMoney = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ""));
    return isNaN(n) ? undefined : n;
  };

  const reset = () => {
    setName("");
    setStage("Sourced");
    setSector("");
    setRaiseStr("");
    setValStr("");
    setFeeStr("2");
    setOwner("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Company name is required.");
      return;
    }
    setSaving(true);
    try {
      await onAdd({
        company_name: name.trim(),
        stage,
        sector: sector || undefined,
        raise_amount: parseMoney(raiseStr),
        valuation: parseMoney(valStr),
        fee_pct: parseFloat(feeStr) || 2,
        deal_owner: owner.trim() || undefined,
      });
      reset();
      onClose();
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add deal.");
    } finally {
      setSaving(false);
    }
  };

  const pickStage = () => {
    Alert.alert(
      "Select Stage",
      undefined,
      STAGES.map((s) => ({
        text: s,
        onPress: () => setStage(s),
      }))
    );
  };

  const pickSector = () => {
    Alert.alert(
      "Select Sector",
      undefined,
      [
        { text: "None", onPress: () => setSector("") },
        ...SECTORS.map((s) => ({ text: s, onPress: () => setSector(s) })),
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          className="bg-slate-900 rounded-t-3xl px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Handle */}
          <View className="w-10 h-1 bg-slate-700 rounded-full self-center mb-4" />

          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white text-lg font-bold">Add Deal</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Company Name *">
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                placeholder="Acme Corp"
                placeholderTextColor="#475569"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </Field>

            <Field label="Stage">
              <TouchableOpacity
                onPress={pickStage}
                className="bg-slate-800 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className="text-white text-sm">{stage}</Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </Field>

            <Field label="Sector">
              <TouchableOpacity
                onPress={pickSector}
                className="bg-slate-800 rounded-xl px-4 py-3 flex-row justify-between items-center"
              >
                <Text className={sector ? "text-white text-sm" : "text-slate-500 text-sm"}>
                  {sector || "Select sector"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>
            </Field>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Field label="Raise Amount ($)">
                  <TextInput
                    className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                    placeholder="5000000"
                    placeholderTextColor="#475569"
                    value={raiseStr}
                    onChangeText={setRaiseStr}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View className="flex-1">
                <Field label="Fee %">
                  <TextInput
                    className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                    placeholder="2"
                    placeholderTextColor="#475569"
                    value={feeStr}
                    onChangeText={setFeeStr}
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
            </View>

            <Field label="Deal Owner">
              <TextInput
                className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
                placeholder="John Smith"
                placeholderTextColor="#475569"
                value={owner}
                onChangeText={setOwner}
              />
            </Field>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              className="bg-blue-600 rounded-xl py-3.5 items-center mt-2 mb-4"
            >
              <Text className="text-white font-semibold">
                {saving ? "Adding..." : "Add Deal"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
        {label}
      </Text>
      {children}
    </View>
  );
}

function DealCard({
  deal,
  onPress,
  onLongPress,
}: {
  deal: Deal;
  onPress: () => void;
  onLongPress: () => void;
}) {
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
      onLongPress={onLongPress}
      delayLongPress={500}
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
