import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeals } from "@/hooks/useDeals";
import { useWorkspace } from "@/hooks/useWorkspace";

interface TaskItem {
  taskId: string;
  text: string;
  done: boolean;
  due?: string;
  dealId: string;
  dealName: string;
}

type Filter = "pending" | "all" | "done";

export default function TasksScreen() {
  const { activeWorkspaceId } = useWorkspace();
  const { deals, loading, refetch, updateDeal } = useDeals(activeWorkspaceId);
  const [filter, setFilter] = useState<Filter>("pending");
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const allTasks = useMemo<TaskItem[]>(() => {
    const tasks: TaskItem[] = [];
    for (const deal of deals) {
      for (const task of deal.tasks || []) {
        if (filter === "pending" && task.done) continue;
        if (filter === "done" && !task.done) continue;
        tasks.push({
          taskId: task.id,
          text: task.text,
          done: task.done,
          due: task.due,
          dealId: deal.id,
          dealName: deal.company_name,
        });
      }
    }
    return tasks;
  }, [deals, filter]);

  const toggleTask = async (dealId: string, taskId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;
    const tasks = (deal.tasks || []).map((t) =>
      t.id === taskId ? { ...t, done: !t.done } : t
    );
    await updateDeal(dealId, { tasks });
  };

  const isOverdue = (due?: string) =>
    due && new Date(due) < new Date() && !isToday(due);
  const isToday = (due?: string) => {
    if (!due) return false;
    const d = new Date(due);
    const t = new Date();
    return d.toDateString() === t.toDateString();
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "done", label: "Completed" },
    { key: "all", label: "All" },
  ];

  const pendingCount = deals.reduce(
    (s, d) => s + (d.tasks || []).filter((t) => !t.done).length,
    0
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Filter tabs */}
      <View className="flex-row border-b border-slate-800 px-4">
        {filters.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setFilter(key)}
            className={`mr-6 py-3 ${filter === key ? "border-b-2 border-blue-500" : ""}`}
          >
            <Text
              className={
                filter === key
                  ? "text-blue-400 font-medium"
                  : "text-slate-400"
              }
            >
              {label}
              {key === "pending" && pendingCount > 0
                ? ` (${pendingCount})`
                : ""}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={allTasks}
        keyExtractor={(item) => `${item.dealId}-${item.taskId}`}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor="#3b82f6"
          />
        }
        contentContainerStyle={{
          padding: 16,
          gap: 10,
          paddingBottom: insets.bottom + 16,
        }}
        renderItem={({ item }) => (
          <View className="bg-slate-800 rounded-xl p-4">
            <View className="flex-row items-start gap-3">
              <Pressable
                onPress={() => toggleTask(item.dealId, item.taskId)}
                hitSlop={8}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mt-0.5 ${
                    item.done
                      ? "bg-green-500 border-green-500"
                      : "border-slate-500"
                  }`}
                >
                  {item.done && (
                    <Text className="text-white text-xs leading-none">✓</Text>
                  )}
                </View>
              </Pressable>

              <View className="flex-1">
                <Text
                  className={`text-sm leading-5 ${item.done ? "text-slate-500 line-through" : "text-white"}`}
                >
                  {item.text}
                </Text>
                <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                  <Pressable onPress={() => router.push(`/deal/${item.dealId}`)}>
                    <Text className="text-blue-400 text-xs">
                      {item.dealName}
                    </Text>
                  </Pressable>
                  {item.due && (
                    <Text
                      className={`text-xs ${
                        isOverdue(item.due)
                          ? "text-red-400"
                          : isToday(item.due)
                            ? "text-amber-400"
                            : "text-slate-500"
                      }`}
                    >
                      {isOverdue(item.due)
                        ? "Overdue"
                        : isToday(item.due)
                          ? "Due today"
                          : new Date(item.due).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-slate-400 text-base">
              {filter === "pending" ? "No pending tasks" : "No tasks"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
