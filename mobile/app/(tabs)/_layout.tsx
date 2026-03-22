import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IoniconsName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0f172a",
          borderTopColor: "#1e293b",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#64748b",
        headerStyle: { backgroundColor: "#0f172a" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pipeline"
        options={{
          title: "Pipeline",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="funnel-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size }) => (
            <TabIcon
              name="checkmark-circle-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
