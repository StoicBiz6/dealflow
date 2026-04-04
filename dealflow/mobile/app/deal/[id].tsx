import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import {
  SECTORS,
  STAGE_CHECKLISTS,
  STAGE_COLORS,
  STAGES,
  formatCurrency,
} from "@/lib/constants";
import type {
  Activity,
  BuyerUniverse,
  Contact,
  Deal,
  Document as DealDocument,
  Task,
} from "@/types/deal";

const WEB_APP_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? "https://deal-tracker.vercel.app";

const TABS = [
  "Overview",
  "Tasks",
  "Contacts",
  "Documents",
  "Activity",
  "Chat",
  "Buyers",
] as const;
type Tab = (typeof TABS)[number];

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [editingDeal, setEditingDeal] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchDeal = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) setDeal(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchDeal();
  }, [fetchDeal]);

  const updateDeal = useCallback(
    async (updates: Partial<Deal>) => {
      if (!deal) return;
      const { data, error } = await supabase
        .from("deals")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (!error && data) setDeal(data as Deal);
    },
    [deal, id]
  );

  const handleStageChange = useCallback(
    async (stage: string) => {
      if (!deal) return;
      const stageKey = stage as keyof typeof STAGE_CHECKLISTS;
      const checklistItems = STAGE_CHECKLISTS[stageKey] || [];
      const existingTexts = (deal.tasks || []).map((t) =>
        t.text.toLowerCase()
      );
      const newTasks = checklistItems
        .filter((text) => !existingTexts.includes(text.toLowerCase()))
        .map((text) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text,
          done: false,
        }));
      const tasks =
        newTasks.length > 0
          ? [...(deal.tasks || []), ...newTasks]
          : deal.tasks;
      await updateDeal({ stage, tasks });
    },
    [deal, updateDeal]
  );

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator color="#3b82f6" size="large" />
      </View>
    );
  }

  if (!deal) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center px-6">
        <Text className="text-white text-lg mb-4">Deal not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-slate-800 rounded-xl px-6 py-3"
        >
          <Text className="text-blue-400">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-3 pb-0">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={8}
            className="flex-row items-center gap-1 mr-auto"
          >
            <Ionicons name="chevron-back" size={20} color="#3b82f6" />
            <Text className="text-blue-400 text-sm">Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setEditingDeal(true)}
            hitSlop={8}
            className="mr-3 p-1"
          >
            <Ionicons name="create-outline" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <StageMenu deal={deal} onStageChange={handleStageChange} />
        </View>

        <Text
          className="text-white text-2xl font-bold leading-tight mb-1"
          numberOfLines={2}
        >
          {deal.company_name}
        </Text>
        <View className="flex-row gap-3 mb-4 flex-wrap">
          {deal.sector ? (
            <Text className="text-slate-400 text-sm">{deal.sector}</Text>
          ) : null}
          {deal.raise_amount ? (
            <Text className="text-slate-400 text-sm">
              Raise: {formatCurrency(deal.raise_amount)}
            </Text>
          ) : null}
          {deal.fee_pct ? (
            <Text className="text-green-400 text-sm font-medium">
              Fee:{" "}
              {formatCurrency((deal.raise_amount || 0) * (deal.fee_pct / 100))}
            </Text>
          ) : null}
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-slate-800"
        >
          {TABS.map((tab) => {
            const badge =
              tab === "Tasks"
                ? (deal.tasks || []).filter((t) => !t.done).length
                : tab === "Contacts"
                  ? (deal.contacts || []).length
                  : tab === "Documents"
                    ? (deal.documents || []).length
                    : tab === "Activity"
                      ? (deal.activity_log || []).length
                      : tab === "Buyers"
                        ? (deal.buyer_universe || []).length
                        : 0;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={`mr-6 pb-3 ${activeTab === tab ? "border-b-2 border-blue-500" : ""}`}
              >
                <Text
                  className={
                    activeTab === tab
                      ? "text-blue-400 font-medium"
                      : "text-slate-400"
                  }
                >
                  {tab}
                  {badge > 0 ? ` (${badge})` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {activeTab === "Overview" && (
          <OverviewTab deal={deal} onUpdate={updateDeal} />
        )}
        {activeTab === "Tasks" && (
          <TasksTab deal={deal} onUpdate={updateDeal} />
        )}
        {activeTab === "Contacts" && (
          <ContactsTab deal={deal} onUpdate={updateDeal} />
        )}
        {activeTab === "Documents" && <DocumentsTab deal={deal} />}
        {activeTab === "Activity" && (
          <ActivityTab deal={deal} onUpdate={updateDeal} />
        )}
        {activeTab === "Chat" && (
          <ChatTab deal={deal} onUpdate={updateDeal} />
        )}
        {activeTab === "Buyers" && <BuyersTab deal={deal} />}
      </KeyboardAvoidingView>

      {/* Edit Deal Modal */}
      <EditDealModal
        deal={deal}
        visible={editingDeal}
        onClose={() => setEditingDeal(false)}
        onSave={async (updates) => {
          await updateDeal(updates);
          setEditingDeal(false);
        }}
      />
    </View>
  );
}

// ─── Stage Menu ───────────────────────────────────────────────────────────────

function StageMenu({
  deal,
  onStageChange,
}: {
  deal: Deal;
  onStageChange: (stage: string) => void;
}) {
  const color =
    STAGE_COLORS[deal.stage as keyof typeof STAGE_COLORS] ?? "#64748b";

  const handlePress = () => {
    Alert.alert("Change Stage", "Select a new stage for this deal", [
      ...STAGES.map((stage) => ({
        text: stage,
        onPress: () => {
          if (stage !== deal.stage) onStageChange(stage);
        },
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
      style={{ backgroundColor: color + "20" }}
    >
      <Text className="text-xs font-medium" style={{ color }}>
        {deal.stage}
      </Text>
      <Ionicons name="chevron-down" size={12} color={color} />
    </TouchableOpacity>
  );
}

// ─── Edit Deal Modal ──────────────────────────────────────────────────────────

function EditDealModal({
  deal,
  visible,
  onClose,
  onSave,
}: {
  deal: Deal;
  visible: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Deal>) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: deal.company_name,
    sector: deal.sector ?? "",
    raise_amount: deal.raise_amount ? String(deal.raise_amount) : "",
    valuation: deal.valuation ? String(deal.valuation) : "",
    fee_pct: deal.fee_pct ? String(deal.fee_pct) : "",
    deal_owner: deal.deal_owner ?? "",
    website: deal.website ?? "",
    expected_close_date: deal.expected_close_date ?? "",
    notes: deal.notes ?? "",
  });

  // Reset form whenever modal opens with fresh deal data
  useEffect(() => {
    if (visible) {
      setForm({
        company_name: deal.company_name,
        sector: deal.sector ?? "",
        raise_amount: deal.raise_amount ? String(deal.raise_amount) : "",
        valuation: deal.valuation ? String(deal.valuation) : "",
        fee_pct: deal.fee_pct ? String(deal.fee_pct) : "",
        deal_owner: deal.deal_owner ?? "",
        website: deal.website ?? "",
        expected_close_date: deal.expected_close_date ?? "",
        notes: deal.notes ?? "",
      });
    }
  }, [visible, deal]);

  const pickSector = () => {
    Alert.alert("Select Sector", undefined, [
      ...SECTORS.map((s) => ({
        text: s,
        onPress: () => setForm((f) => ({ ...f, sector: s })),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      Alert.alert("Required", "Company name is required.");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        company_name: form.company_name.trim(),
        sector: form.sector || undefined,
        raise_amount: form.raise_amount
          ? parseFloat(form.raise_amount)
          : undefined,
        valuation: form.valuation ? parseFloat(form.valuation) : undefined,
        fee_pct: form.fee_pct ? parseFloat(form.fee_pct) : undefined,
        deal_owner: form.deal_owner || undefined,
        website: form.website || undefined,
        expected_close_date: form.expected_close_date || undefined,
        notes: form.notes || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 bg-slate-900"
        style={{ paddingTop: insets.top > 0 ? insets.top : 16 }}
      >
        {/* Modal Header */}
        <View className="flex-row items-center justify-between px-4 mb-6">
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text className="text-slate-400 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-white font-semibold text-base">Edit Deal</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} hitSlop={8}>
            {saving ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Text className="text-blue-400 font-semibold text-base">
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          <EditField
            label="Company Name"
            value={form.company_name}
            onChangeText={(v) => setForm((f) => ({ ...f, company_name: v }))}
            placeholder="Company name"
          />
          <EditFieldTappable
            label="Sector"
            value={form.sector || "Select sector…"}
            onPress={pickSector}
            placeholder
          />
          <EditField
            label="Raise Amount ($)"
            value={form.raise_amount}
            onChangeText={(v) => setForm((f) => ({ ...f, raise_amount: v }))}
            placeholder="e.g. 5000000"
            keyboardType="decimal-pad"
          />
          <EditField
            label="Valuation ($)"
            value={form.valuation}
            onChangeText={(v) => setForm((f) => ({ ...f, valuation: v }))}
            placeholder="e.g. 25000000"
            keyboardType="decimal-pad"
          />
          <EditField
            label="Fee %"
            value={form.fee_pct}
            onChangeText={(v) => setForm((f) => ({ ...f, fee_pct: v }))}
            placeholder="e.g. 2"
            keyboardType="decimal-pad"
          />
          <EditField
            label="Deal Owner"
            value={form.deal_owner}
            onChangeText={(v) => setForm((f) => ({ ...f, deal_owner: v }))}
            placeholder="Name"
          />
          <EditField
            label="Website"
            value={form.website}
            onChangeText={(v) => setForm((f) => ({ ...f, website: v }))}
            placeholder="https://..."
            keyboardType="url"
            autoCapitalize="none"
          />
          <EditField
            label="Expected Close Date"
            value={form.expected_close_date}
            onChangeText={(v) =>
              setForm((f) => ({ ...f, expected_close_date: v }))
            }
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
          />
          <EditField
            label="Notes"
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Internal notes..."
            multiline
            numberOfLines={4}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  multiline,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "decimal-pad" | "url" | "numbers-and-punctuation";
  autoCapitalize?: "none" | "sentences";
  multiline?: boolean;
  numberOfLines?: number;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </Text>
      <TextInput
        className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "sentences"}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={multiline ? { minHeight: 80, textAlignVertical: "top" } : undefined}
      />
    </View>
  );
}

function EditFieldTappable({
  label,
  value,
  onPress,
  placeholder,
}: {
  label: string;
  value: string;
  onPress: () => void;
  placeholder?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
        {label}
      </Text>
      <TouchableOpacity
        onPress={onPress}
        className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center justify-between"
      >
        <Text
          className={`text-sm ${placeholder ? "text-slate-500" : "text-white"}`}
        >
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (u: Partial<Deal>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [editingMemo, setEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState(deal.memo ?? "");

  useEffect(() => {
    setMemoText(deal.memo ?? "");
  }, [deal.memo]);

  const saveMemo = () => {
    onUpdate({ memo: memoText });
    setEditingMemo(false);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Deal Info */}
      <SectionCard title="Deal Info">
        <InfoRow
          label="Raise Amount"
          value={deal.raise_amount ? formatCurrency(deal.raise_amount) : "—"}
        />
        <InfoRow
          label="Valuation"
          value={deal.valuation ? formatCurrency(deal.valuation) : "—"}
        />
        <InfoRow
          label="Fee %"
          value={deal.fee_pct ? `${deal.fee_pct}%` : "2%"}
        />
        <InfoRow
          label="Est. Fee"
          value={
            deal.raise_amount
              ? formatCurrency(
                  deal.raise_amount * ((deal.fee_pct || 2) / 100)
                )
              : "—"
          }
          green
        />
        <InfoRow label="Deal Owner" value={deal.deal_owner || "—"} />
        <InfoRow
          label="Expected Close"
          value={
            deal.expected_close_date
              ? new Date(deal.expected_close_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
        />
        {deal.website ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(deal.website!)}
            className="flex-row justify-between items-center py-2 border-b border-slate-700/80"
          >
            <Text className="text-slate-400 text-sm">Website</Text>
            <Text className="text-blue-400 text-sm font-medium" numberOfLines={1}>
              {deal.website.replace(/^https?:\/\//, "")}
            </Text>
          </TouchableOpacity>
        ) : null}
      </SectionCard>

      {/* Financials */}
      {deal.metrics && Object.values(deal.metrics).some(Boolean) && (
        <SectionCard title="Financials">
          {deal.metrics.revenue && (
            <InfoRow label="Revenue" value={deal.metrics.revenue} />
          )}
          {deal.metrics.ebitda && (
            <InfoRow label="EBITDA" value={deal.metrics.ebitda} />
          )}
          {deal.metrics.ebitda_margin && (
            <InfoRow
              label="EBITDA Margin"
              value={deal.metrics.ebitda_margin}
            />
          )}
          {deal.metrics.arr && (
            <InfoRow label="ARR" value={deal.metrics.arr} />
          )}
          {deal.metrics.growth_rate && (
            <InfoRow label="Growth Rate" value={deal.metrics.growth_rate} />
          )}
          {deal.metrics.gross_margin && (
            <InfoRow label="Gross Margin" value={deal.metrics.gross_margin} />
          )}
          {deal.metrics.employees && (
            <InfoRow label="Employees" value={deal.metrics.employees} />
          )}
          {deal.metrics.founded && (
            <InfoRow label="Founded" value={deal.metrics.founded} />
          )}
          {deal.metrics.other && (
            <InfoRow label="Other" value={deal.metrics.other} />
          )}
        </SectionCard>
      )}

      {/* Investment Memo */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-semibold">Investment Memo</Text>
          <TouchableOpacity
            onPress={() => (editingMemo ? saveMemo() : setEditingMemo(true))}
          >
            <Text className="text-blue-400 text-sm">
              {editingMemo ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
        {editingMemo ? (
          <TextInput
            className="text-slate-300 text-sm leading-5 min-h-24"
            value={memoText}
            onChangeText={setMemoText}
            multiline
            autoFocus
            placeholderTextColor="#64748b"
            placeholder="Add investment thesis..."
            style={{ textAlignVertical: "top" }}
          />
        ) : (
          <Text className="text-slate-300 text-sm leading-5">
            {deal.memo || (
              <Text className="text-slate-500 italic">
                No memo yet — tap Edit to add
              </Text>
            )}
          </Text>
        )}
      </View>

      {/* Notes */}
      {deal.notes ? (
        <SectionCard title="Notes">
          <Text className="text-slate-300 text-sm leading-5">{deal.notes}</Text>
        </SectionCard>
      ) : null}

      {/* Buyers summary */}
      {deal.buyers && deal.buyers.length > 0 && (
        <SectionCard title={`Buyers (${deal.buyers.length})`}>
          {deal.buyers.slice(0, 5).map((b) => (
            <View
              key={b.id}
              className="flex-row justify-between items-center py-2 border-b border-slate-700 last:border-0"
            >
              <View>
                <Text className="text-white text-sm">{b.name}</Text>
                {b.firm ? (
                  <Text className="text-slate-400 text-xs">{b.firm}</Text>
                ) : null}
              </View>
              <View
                className={`rounded-full px-2 py-0.5 ${b.status === "Passed" ? "bg-red-500/20" : "bg-green-500/20"}`}
              >
                <Text
                  className={`text-xs ${b.status === "Passed" ? "text-red-400" : "text-green-400"}`}
                >
                  {b.status}
                </Text>
              </View>
            </View>
          ))}
          {deal.buyers.length > 5 && (
            <Text className="text-slate-500 text-xs mt-2">
              +{deal.buyers.length - 5} more
            </Text>
          )}
        </SectionCard>
      )}
    </ScrollView>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (u: Partial<Deal>) => void;
}) {
  const [newTask, setNewTask] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const tasks = deal.tasks || [];
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    onUpdate({ tasks: updated });
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const updated: Task[] = [
      ...tasks,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: newTask.trim(),
        done: false,
        due: newTaskDue.trim() || undefined,
      },
    ];
    onUpdate({ tasks: updated });
    setNewTask("");
    setNewTaskDue("");
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    onUpdate({ tasks: updated });
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 80,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Add task input */}
      <View className="mb-6">
        <View className="flex-row gap-2 mb-2">
          <TextInput
            ref={inputRef}
            className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
            placeholder="Add a task..."
            placeholderTextColor="#64748b"
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={addTask}
            returnKeyType="done"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            onPress={addTask}
            className="bg-blue-600 rounded-xl px-4 py-3 items-center justify-center"
          >
            <Text className="text-white font-medium text-sm">Add</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          className="bg-slate-800/60 text-slate-300 rounded-xl px-4 py-2.5 text-xs"
          placeholder="Due date (YYYY-MM-DD) — optional"
          placeholderTextColor="#475569"
          value={newTaskDue}
          onChangeText={setNewTaskDue}
          keyboardType="numbers-and-punctuation"
        />
      </View>

      {/* Pending */}
      {pending.length > 0 && (
        <View className="mb-4">
          <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Pending · {pending.length}
          </Text>
          {pending.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
        </View>
      )}

      {/* Done */}
      {done.length > 0 && (
        <View>
          <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Completed · {done.length}
          </Text>
          {done.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
        </View>
      )}

      {tasks.length === 0 && (
        <View className="items-center py-16">
          <Text className="text-slate-500 text-base">No tasks yet</Text>
          <Text className="text-slate-600 text-sm mt-1">
            Add tasks above or change the stage to auto-populate
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onToggle(task.id)}
      onLongPress={() =>
        Alert.alert("Delete task?", task.text, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => onDelete(task.id),
          },
        ])
      }
      className="flex-row items-center gap-3 py-3 border-b border-slate-800/80 last:border-0"
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 ${
          task.done ? "bg-green-500 border-green-500" : "border-slate-500"
        }`}
      >
        {task.done && (
          <Text className="text-white text-xs leading-none">✓</Text>
        )}
      </View>
      <Text
        className={`flex-1 text-sm leading-5 ${task.done ? "text-slate-500 line-through" : "text-white"}`}
      >
        {task.text}
      </Text>
      {task.due && (
        <Text className="text-slate-500 text-xs flex-shrink-0">
          {new Date(task.due).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </Text>
      )}
    </Pressable>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────

function ContactsTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (u: Partial<Deal>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    firm: "",
    email: "",
    phone: "",
    notes: "",
  });

  const contacts = deal.contacts || [];

  const addContact = () => {
    if (!form.name.trim()) {
      Alert.alert("Required", "Contact name is required.");
      return;
    }
    const newContact: Contact = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: form.name.trim(),
      title: form.title.trim() || undefined,
      firm: form.firm.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    onUpdate({ contacts: [...contacts, newContact] });
    setForm({ name: "", title: "", firm: "", email: "", phone: "", notes: "" });
    setShowAdd(false);
  };

  const deleteContact = (contactId: string) => {
    Alert.alert("Remove contact?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          onUpdate({ contacts: contacts.filter((c) => c.id !== contactId) }),
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Add contact button */}
      {!showAdd && (
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          className="bg-blue-600/10 border border-blue-500/30 rounded-xl py-3 flex-row items-center justify-center gap-2 mb-4"
        >
          <Ionicons name="person-add-outline" size={16} color="#3b82f6" />
          <Text className="text-blue-400 font-medium text-sm">
            Add Contact
          </Text>
        </TouchableOpacity>
      )}

      {/* Add contact form */}
      {showAdd && (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-4">New Contact</Text>
          {[
            { key: "name", label: "Name *", placeholder: "Full name" },
            { key: "title", label: "Title", placeholder: "e.g. CEO" },
            { key: "firm", label: "Firm", placeholder: "Company" },
            {
              key: "email",
              label: "Email",
              placeholder: "email@domain.com",
              keyboardType: "email-address" as const,
              autoCapitalize: "none" as const,
            },
            {
              key: "phone",
              label: "Phone",
              placeholder: "+1 555 0100",
              keyboardType: "phone-pad" as const,
            },
            { key: "notes", label: "Notes", placeholder: "Optional notes" },
          ].map(({ key, label, placeholder, keyboardType, autoCapitalize }) => (
            <View key={key} className="mb-3">
              <Text className="text-slate-400 text-xs mb-1">{label}</Text>
              <TextInput
                className="bg-slate-700 text-white rounded-lg px-3 py-2.5 text-sm"
                value={form[key as keyof typeof form]}
                onChangeText={(v) =>
                  setForm((f) => ({ ...f, [key]: v }))
                }
                placeholder={placeholder}
                placeholderTextColor="#475569"
                keyboardType={keyboardType ?? "default"}
                autoCapitalize={autoCapitalize ?? "words"}
              />
            </View>
          ))}
          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity
              onPress={() => setShowAdd(false)}
              className="flex-1 bg-slate-700 rounded-xl py-3 items-center"
            >
              <Text className="text-slate-300 text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addContact}
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium text-sm">
                Add Contact
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Contact list */}
      {contacts.length === 0 && !showAdd ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="people-outline" size={40} color="#334155" />
          <Text className="text-slate-400 text-base mt-3">No contacts yet</Text>
          <Text className="text-slate-600 text-sm mt-1">
            Add a contact above or via the web app
          </Text>
        </View>
      ) : (
        contacts.map((c) => (
          <Pressable
            key={c.id}
            onLongPress={() => deleteContact(c.id)}
            className="bg-slate-800 rounded-xl p-4 mb-3 active:opacity-80"
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-white font-semibold">{c.name}</Text>
                {c.title ? (
                  <Text className="text-slate-400 text-sm mt-0.5">
                    {c.title}
                  </Text>
                ) : null}
                {c.firm ? (
                  <Text className="text-slate-500 text-xs mt-0.5">
                    {c.firm}
                  </Text>
                ) : null}
              </View>
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center ml-3">
                <Text className="text-white text-base font-bold">
                  {c.name[0]?.toUpperCase()}
                </Text>
              </View>
            </View>
            {(c.email || c.phone) && (
              <View className="mt-3 gap-2">
                {c.email && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${c.email}`)}
                    className="flex-row items-center gap-2"
                  >
                    <Ionicons
                      name="mail-outline"
                      size={14}
                      color="#3b82f6"
                    />
                    <Text className="text-blue-400 text-sm">{c.email}</Text>
                  </TouchableOpacity>
                )}
                {c.phone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${c.phone}`)}
                    className="flex-row items-center gap-2"
                  >
                    <Ionicons
                      name="call-outline"
                      size={14}
                      color="#4ade80"
                    />
                    <Text className="text-green-400 text-sm">{c.phone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {c.notes && (
              <Text className="text-slate-500 text-xs mt-2 leading-4">
                {c.notes}
              </Text>
            )}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

// ─── Documents Tab ─────────────────────────────────────────────────────────────

const DOC_ICONS: Record<string, string> = {
  pdf: "document-text",
  doc: "document-text",
  docx: "document-text",
  xls: "grid",
  xlsx: "grid",
  ppt: "easel",
  pptx: "easel",
  png: "image",
  jpg: "image",
  jpeg: "image",
};

function getDocIcon(doc: DealDocument): string {
  const ext = doc.name.split(".").pop()?.toLowerCase() ?? doc.type ?? "";
  return DOC_ICONS[ext] ?? "document-outline";
}

function formatBytes(bytes?: number): string {
  if (!bytes) return "";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function DocumentsTab({ deal }: { deal: Deal }) {
  const insets = useSafeAreaInsets();
  const documents = deal.documents || [];

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
    >
      {documents.length === 0 ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="folder-open-outline" size={44} color="#334155" />
          <Text className="text-slate-400 text-base mt-3">No documents</Text>
          <Text className="text-slate-600 text-sm mt-1 text-center">
            Upload documents from the web app's data room
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            {documents.length} Document{documents.length !== 1 ? "s" : ""}
          </Text>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              onPress={() => doc.url && Linking.openURL(doc.url)}
              className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center gap-4 active:opacity-70"
            >
              <View className="w-10 h-10 rounded-lg bg-slate-700 items-center justify-center flex-shrink-0">
                <Ionicons
                  name={getDocIcon(doc) as never}
                  size={20}
                  color="#3b82f6"
                />
              </View>
              <View className="flex-1 min-w-0">
                <Text
                  className="text-white text-sm font-medium"
                  numberOfLines={1}
                >
                  {doc.name}
                </Text>
                <View className="flex-row items-center gap-2 mt-0.5 flex-wrap">
                  {doc.size ? (
                    <Text className="text-slate-500 text-xs">
                      {formatBytes(doc.size)}
                    </Text>
                  ) : null}
                  {doc.uploaded_at ? (
                    <Text className="text-slate-500 text-xs">
                      {new Date(doc.uploaded_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Ionicons name="open-outline" size={16} color="#475569" />
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── AI Chat Tab ──────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposal?: Partial<Deal>;
  isError?: boolean;
}

function formatProposal(data: Partial<Deal>): string {
  const lines: string[] = [];
  if (data.company_name) lines.push(`• Company: ${data.company_name}`);
  if (data.stage) lines.push(`• Stage: ${data.stage}`);
  if (data.raise_amount)
    lines.push(`• Raise: ${formatCurrency(data.raise_amount)}`);
  if (data.valuation)
    lines.push(`• Valuation: ${formatCurrency(data.valuation)}`);
  if (data.sector) lines.push(`• Sector: ${data.sector}`);
  if (data.fee_pct) lines.push(`• Fee: ${data.fee_pct}%`);
  if (data.deal_owner) lines.push(`• Owner: ${data.deal_owner}`);
  if (data.notes) lines.push(`• Notes: ${data.notes}`);
  return lines.join("\n");
}

function ChatTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (u: Partial<Deal>) => void;
}) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: `I can help you update this deal. Describe any changes — stage, raise amount, sector, notes — and I'll parse them for you to review before applying.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);
    try {
      // Provide deal context so the AI can interpret relative updates
      const contextual = `[Deal: ${deal.company_name}, Stage: ${deal.stage}, Raise: ${deal.raise_amount ? formatCurrency(deal.raise_amount) : "N/A"}, Sector: ${deal.sector || "N/A"}]\n\n${text}`;

      const res = await fetch(`${WEB_APP_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextual }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `I couldn't parse that as a deal update: ${data.error}\n\nTry describing specific changes like "move to Diligence" or "update raise to $8M".`,
            isError: true,
          },
        ]);
      } else {
        // Strip non-updatable fields, keep only deal fields
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, created_at: _ca, updated_at: _ua, ...proposal } =
          data as Deal;

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: `Here's what I parsed:\n\n${formatProposal(proposal)}`,
            proposal,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: "assistant",
          content: "Network error — check your connection and try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const applyProposal = (proposal: Partial<Deal>, msgId: string) => {
    Alert.alert(
      "Apply Changes?",
      "This will update the deal with the parsed values.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: () => {
            onUpdate(proposal);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msgId ? { ...m, proposal: undefined } : m
              )
            );
            setMessages((prev) => [
              ...prev,
              {
                id: `applied-${Date.now()}`,
                role: "assistant",
                content: "Changes applied to the deal.",
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            className={`mb-4 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <View
              className={`rounded-2xl px-4 py-3 max-w-[85%] ${
                msg.role === "user"
                  ? "bg-blue-600 rounded-br-sm"
                  : msg.isError
                    ? "bg-red-500/10 border border-red-500/30 rounded-bl-sm"
                    : "bg-slate-800 rounded-bl-sm"
              }`}
            >
              <Text
                className={`text-sm leading-5 ${
                  msg.role === "user"
                    ? "text-white"
                    : msg.isError
                      ? "text-red-300"
                      : "text-slate-200"
                }`}
              >
                {msg.content}
              </Text>
            </View>
            {msg.proposal && (
              <View className="flex-row gap-2 mt-2">
                <TouchableOpacity
                  onPress={() => applyProposal(msg.proposal!, msg.id)}
                  className="bg-green-600 rounded-lg px-4 py-2"
                >
                  <Text className="text-white text-xs font-semibold">
                    Apply Changes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === msg.id ? { ...m, proposal: undefined } : m
                      )
                    )
                  }
                  className="bg-slate-700 rounded-lg px-4 py-2"
                >
                  <Text className="text-slate-400 text-xs">Dismiss</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View className="items-start mb-4">
            <View className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <View className="flex-row gap-1 items-center">
                <View className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <View className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <View className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View
        className="flex-row gap-2 px-4 py-3 border-t border-slate-800 bg-slate-900"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <TextInput
          className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-3 text-sm"
          placeholder='e.g. "Move to Diligence, raise is $8M"'
          placeholderTextColor="#475569"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={loading || !input.trim()}
          className={`rounded-xl px-4 py-3 items-center justify-center ${
            loading || !input.trim() ? "bg-slate-700" : "bg-blue-600"
          }`}
        >
          <Ionicons
            name="send"
            size={18}
            color={loading || !input.trim() ? "#475569" : "#fff"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_CONFIG: Record<
  Activity["type"],
  { icon: string; color: string; label: string }
> = {
  call: { icon: "call-outline", color: "#4ade80", label: "Call" },
  email: { icon: "mail-outline", color: "#3b82f6", label: "Email" },
  meeting: { icon: "people-outline", color: "#a78bfa", label: "Meeting" },
  note: { icon: "create-outline", color: "#94a3b8", label: "Note" },
};

function ActivityTab({
  deal,
  onUpdate,
}: {
  deal: Deal;
  onUpdate: (u: Partial<Deal>) => void;
}) {
  const insets = useSafeAreaInsets();
  const [showAdd, setShowAdd] = useState(false);
  const [actType, setActType] = useState<Activity["type"]>("note");
  const [actNote, setActNote] = useState("");
  const [saving, setSaving] = useState(false);

  const activities = [...(deal.activity_log || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const pickType = () => {
    Alert.alert(
      "Activity Type",
      undefined,
      (["call", "email", "meeting", "note"] as Activity["type"][]).map((t) => ({
        text: ACTIVITY_TYPE_CONFIG[t].label,
        onPress: () => setActType(t),
      }))
    );
  };

  const addActivity = async () => {
    if (!actNote.trim()) {
      Alert.alert("Required", "Please add a note.");
      return;
    }
    setSaving(true);
    const newActivity: Activity = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: actType,
      note: actNote.trim(),
      date: new Date().toISOString(),
    };
    await onUpdate({ activity_log: [...(deal.activity_log || []), newActivity] });
    setActNote("");
    setShowAdd(false);
    setSaving(false);
  };

  const deleteActivity = (actId: string) => {
    Alert.alert("Delete activity?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          onUpdate({
            activity_log: activities.filter((a) => a.id !== actId),
          }),
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Add activity button */}
      {!showAdd && (
        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          className="bg-blue-600/10 border border-blue-500/30 rounded-xl py-3 flex-row items-center justify-center gap-2 mb-4"
        >
          <Ionicons name="add-circle-outline" size={16} color="#3b82f6" />
          <Text className="text-blue-400 font-medium text-sm">
            Log Activity
          </Text>
        </TouchableOpacity>
      )}

      {/* Add form */}
      {showAdd && (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-4">Log Activity</Text>

          <TouchableOpacity
            onPress={pickType}
            className="bg-slate-700 rounded-xl px-4 py-2.5 flex-row items-center gap-2 mb-3 self-start"
          >
            <Ionicons
              name={ACTIVITY_TYPE_CONFIG[actType].icon as never}
              size={16}
              color={ACTIVITY_TYPE_CONFIG[actType].color}
            />
            <Text className="text-white text-sm">
              {ACTIVITY_TYPE_CONFIG[actType].label}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#64748b" />
          </TouchableOpacity>

          <TextInput
            className="bg-slate-700 text-white rounded-xl px-4 py-3 text-sm min-h-20 mb-4"
            placeholder="What happened?"
            placeholderTextColor="#475569"
            value={actNote}
            onChangeText={setActNote}
            multiline
            autoFocus
            style={{ textAlignVertical: "top" }}
          />

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                setShowAdd(false);
                setActNote("");
              }}
              className="flex-1 bg-slate-700 rounded-xl py-3 items-center"
            >
              <Text className="text-slate-300 text-sm">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={addActivity}
              disabled={saving}
              className="flex-1 bg-blue-600 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-medium text-sm">
                {saving ? "Saving..." : "Log"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Activity list */}
      {activities.length === 0 && !showAdd ? (
        <View className="items-center py-16">
          <Ionicons name="pulse-outline" size={44} color="#334155" />
          <Text className="text-slate-400 text-base mt-3">No activity yet</Text>
          <Text className="text-slate-600 text-sm mt-1">
            Log calls, emails, and meetings above
          </Text>
        </View>
      ) : (
        activities.map((act) => {
          const cfg = ACTIVITY_TYPE_CONFIG[act.type] ?? ACTIVITY_TYPE_CONFIG.note;
          return (
            <Pressable
              key={act.id}
              onLongPress={() => deleteActivity(act.id)}
              className="flex-row gap-3 mb-4"
            >
              <View
                className="w-8 h-8 rounded-full items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: cfg.color + "20" }}
              >
                <Ionicons name={cfg.icon as never} size={16} color={cfg.color} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wide">
                    {cfg.label}
                  </Text>
                  <Text className="text-slate-600 text-xs">
                    {new Date(act.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
                <Text className="text-white text-sm leading-5">{act.note}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Buyer Universe Tab ───────────────────────────────────────────────────────

const BUYER_TYPE_COLORS: Record<string, string> = {
  PE: "#7c3aed",
  Strategic: "#2563eb",
  "Family Office": "#0891b2",
  "Growth Equity": "#16a34a",
};

function BuyersTab({ deal }: { deal: Deal }) {
  const insets = useSafeAreaInsets();
  const buyers = deal.buyer_universe || [];

  const byType = buyers.reduce<Record<string, BuyerUniverse[]>>((acc, b) => {
    const t = b.type ?? "Other";
    if (!acc[t]) acc[t] = [];
    acc[t].push(b);
    return acc;
  }, {});

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
    >
      {buyers.length === 0 ? (
        <View className="items-center justify-center py-16">
          <Ionicons name="briefcase-outline" size={44} color="#334155" />
          <Text className="text-slate-400 text-base mt-3">
            No buyer universe yet
          </Text>
          <Text className="text-slate-600 text-sm mt-1 text-center px-8">
            Generate a buyer list from the web app using AI
          </Text>
        </View>
      ) : (
        <>
          <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-4">
            {buyers.length} Potential Buyer{buyers.length !== 1 ? "s" : ""}
          </Text>

          {Object.entries(byType).map(([type, list]) => (
            <View key={type} className="mb-5">
              <View className="flex-row items-center gap-2 mb-3">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: BUYER_TYPE_COLORS[type] ?? "#64748b",
                  }}
                />
                <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  {type} · {list.length}
                </Text>
              </View>

              {list.map((buyer, idx) => (
                <View
                  key={idx}
                  className="bg-slate-800 rounded-xl p-4 mb-3"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-white font-semibold flex-1 mr-2">
                      {buyer.name}
                    </Text>
                    <View
                      className="rounded-full px-2.5 py-1"
                      style={{
                        backgroundColor:
                          (BUYER_TYPE_COLORS[buyer.type] ?? "#64748b") + "20",
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{
                          color: BUYER_TYPE_COLORS[buyer.type] ?? "#94a3b8",
                        }}
                      >
                        {buyer.type}
                      </Text>
                    </View>
                  </View>

                  {buyer.thesis && (
                    <Text className="text-slate-400 text-xs leading-4 mb-3">
                      {buyer.thesis}
                    </Text>
                  )}

                  <View className="gap-1.5">
                    {buyer.contact_name && (
                      <View className="flex-row items-center gap-1.5">
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color="#64748b"
                        />
                        <Text className="text-slate-400 text-xs">
                          {buyer.contact_name}
                          {buyer.contact_title
                            ? `, ${buyer.contact_title}`
                            : ""}
                        </Text>
                      </View>
                    )}
                    {buyer.email && (
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`mailto:${buyer.email}`)
                        }
                        className="flex-row items-center gap-1.5"
                      >
                        <Ionicons
                          name="mail-outline"
                          size={12}
                          color="#3b82f6"
                        />
                        <Text className="text-blue-400 text-xs">
                          {buyer.email}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {buyer.phone && (
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(`tel:${buyer.phone}`)
                        }
                        className="flex-row items-center gap-1.5"
                      >
                        <Ionicons
                          name="call-outline"
                          size={12}
                          color="#4ade80"
                        />
                        <Text className="text-green-400 text-xs">
                          {buyer.phone}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {buyer.website && (
                      <TouchableOpacity
                        onPress={() =>
                          buyer.website && Linking.openURL(buyer.website)
                        }
                        className="flex-row items-center gap-1.5"
                      >
                        <Ionicons
                          name="globe-outline"
                          size={12}
                          color="#94a3b8"
                        />
                        <Text className="text-slate-400 text-xs">
                          {buyer.website.replace(/^https?:\/\//, "")}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {buyer.notes && (
                    <Text className="text-slate-600 text-xs mt-2 leading-4 italic">
                      {buyer.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-slate-800 rounded-2xl p-4 mb-4">
      <Text className="text-white font-semibold mb-3">{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-slate-700/80 last:border-0">
      <Text className="text-slate-400 text-sm">{label}</Text>
      <Text
        className={`text-sm font-medium ${green ? "text-green-400" : "text-white"}`}
      >
        {value}
      </Text>
    </View>
  );
}
