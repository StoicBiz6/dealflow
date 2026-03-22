import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspace();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-slate-900 px-4"
      style={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}
    >
      {/* Profile */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-lg font-bold">
              {(user?.firstName?.[0] ?? user?.primaryEmailAddress?.emailAddress?.[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">
              {user?.fullName ?? "—"}
            </Text>
            <Text className="text-slate-400 text-sm">
              {user?.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
        </View>
      </View>

      {/* Workspace switcher */}
      {workspaces.length > 0 && (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-white font-semibold mb-3">Workspace</Text>

          <TouchableOpacity
            onPress={() => setActiveWorkspace(null)}
            className="flex-row items-center justify-between py-2.5 border-b border-slate-700"
          >
            <Text className="text-slate-300 text-sm">Personal</Text>
            {!activeWorkspaceId && (
              <Ionicons name="checkmark" size={18} color="#3b82f6" />
            )}
          </TouchableOpacity>

          {workspaces.map((ws) => (
            <TouchableOpacity
              key={ws.id}
              onPress={() => setActiveWorkspace(ws.id)}
              className="flex-row items-center justify-between py-2.5"
            >
              <Text className="text-slate-300 text-sm">{ws.name}</Text>
              {activeWorkspaceId === ws.id && (
                <Ionicons name="checkmark" size={18} color="#3b82f6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* App info */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row justify-between py-2">
          <Text className="text-slate-400 text-sm">Version</Text>
          <Text className="text-slate-300 text-sm">1.0.0</Text>
        </View>
        <View className="flex-row justify-between py-2 border-t border-slate-700">
          <Text className="text-slate-400 text-sm">Backend</Text>
          <Text className="text-slate-300 text-sm">Supabase</Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        onPress={() => signOut()}
        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="log-out-outline" size={18} color="#f87171" />
        <Text className="text-red-400 font-medium">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
