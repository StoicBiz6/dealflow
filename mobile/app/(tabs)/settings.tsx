import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspace } from "@/hooks/useWorkspace";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    joinWorkspace,
    loading,
  } = useWorkspace();
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{
        padding: 16,
        paddingBottom: insets.bottom + 16,
      }}
    >
      {/* Profile */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-blue-600 items-center justify-center">
            <Text className="text-white text-lg font-bold">
              {(
                user?.firstName?.[0] ??
                user?.primaryEmailAddress?.emailAddress?.[0] ??
                "?"
              ).toUpperCase()}
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

      {/* Workspace section */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-white font-semibold">Workspace</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setShowJoinModal(true)}
              className="bg-slate-700 rounded-lg px-3 py-1.5 flex-row items-center gap-1"
            >
              <Ionicons name="link-outline" size={14} color="#94a3b8" />
              <Text className="text-slate-300 text-xs">Join</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="bg-blue-600/20 rounded-lg px-3 py-1.5 flex-row items-center gap-1"
            >
              <Ionicons name="add" size={14} color="#3b82f6" />
              <Text className="text-blue-400 text-xs">New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <Text className="text-slate-500 text-sm py-2">Loading...</Text>
        ) : (
          <>
            <TouchableOpacity
              onPress={() => setActiveWorkspace(null)}
              className="flex-row items-center justify-between py-2.5 border-b border-slate-700"
            >
              <View>
                <Text className="text-slate-300 text-sm">Personal</Text>
                <Text className="text-slate-600 text-xs">My deals only</Text>
              </View>
              {!activeWorkspaceId && (
                <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
              )}
            </TouchableOpacity>

            {workspaces.map((ws) => (
              <TouchableOpacity
                key={ws.id}
                onPress={() => setActiveWorkspace(ws.id)}
                className="flex-row items-center justify-between py-2.5 border-b border-slate-700 last:border-0"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-slate-300 text-sm">{ws.name}</Text>
                  <Text className="text-slate-600 text-xs">
                    Code: {ws.invite_code}
                  </Text>
                </View>
                {activeWorkspaceId === ws.id && (
                  <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}

            {workspaces.length === 0 && (
              <View className="py-4 items-center">
                <Text className="text-slate-500 text-sm">
                  No workspaces yet
                </Text>
                <Text className="text-slate-600 text-xs mt-1">
                  Create one to collaborate with your team
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Active workspace invite code (for sharing) */}
      {activeWs && (
        <View className="bg-slate-800 rounded-2xl p-4 mb-4">
          <Text className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">
            Invite Others to {activeWs.name}
          </Text>
          <View className="bg-slate-900 rounded-xl px-4 py-3 flex-row items-center justify-between">
            <Text className="text-white font-mono text-lg tracking-widest">
              {activeWs.invite_code}
            </Text>
            <Text className="text-slate-500 text-xs">invite code</Text>
          </View>
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
        onPress={handleSignOut}
        className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex-row items-center justify-center gap-2"
      >
        <Ionicons name="log-out-outline" size={18} color="#f87171" />
        <Text className="text-red-400 font-medium">Sign Out</Text>
      </TouchableOpacity>

      <CreateWorkspaceModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={createWorkspace}
      />
      <JoinWorkspaceModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={joinWorkspace}
      />
    </ScrollView>
  );
}

function CreateWorkspaceModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Workspace name is required.");
      return;
    }
    setSaving(true);
    try {
      await onCreate(name.trim());
      setName("");
      onClose();
    } catch (e: unknown) {
      Alert.alert(
        "Error",
        e instanceof Error ? e.message : "Failed to create workspace."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View
          className="bg-slate-900 rounded-t-3xl px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="w-10 h-1 bg-slate-700 rounded-full self-center mb-4" />
          <Text className="text-white text-lg font-bold mb-5">
            Create Workspace
          </Text>

          <Text className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
            Workspace Name
          </Text>
          <TextInput
            className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm mb-4"
            placeholder="Stoic Capital"
            placeholderTextColor="#475569"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text className="text-slate-600 text-xs mb-6">
            An invite code will be generated automatically. Share it with your
            team members.
          </Text>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={saving}
            className="bg-blue-600 rounded-xl py-3.5 items-center mb-4"
          >
            <Text className="text-white font-semibold">
              {saving ? "Creating..." : "Create Workspace"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function JoinWorkspaceModal({
  visible,
  onClose,
  onJoin,
}: {
  visible: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<unknown>;
}) {
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  const handleJoin = async () => {
    if (!code.trim()) {
      Alert.alert("Required", "Please enter an invite code.");
      return;
    }
    setSaving(true);
    try {
      await onJoin(code.trim());
      setCode("");
      onClose();
    } catch (e: unknown) {
      Alert.alert(
        "Invalid Code",
        e instanceof Error ? e.message : "Could not find workspace."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        <View
          className="bg-slate-900 rounded-t-3xl px-4 pt-4"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View className="w-10 h-1 bg-slate-700 rounded-full self-center mb-4" />
          <Text className="text-white text-lg font-bold mb-5">
            Join Workspace
          </Text>

          <Text className="text-slate-400 text-xs font-medium mb-1.5 uppercase tracking-wide">
            Invite Code
          </Text>
          <TextInput
            className="bg-slate-800 text-white rounded-xl px-4 py-3 text-sm mb-6 font-mono tracking-widest"
            placeholder="ABC123"
            placeholderTextColor="#475569"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            autoFocus
          />

          <TouchableOpacity
            onPress={handleJoin}
            disabled={saving}
            className="bg-blue-600 rounded-xl py-3.5 items-center mb-4"
          >
            <Text className="text-white font-semibold">
              {saving ? "Joining..." : "Join Workspace"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
