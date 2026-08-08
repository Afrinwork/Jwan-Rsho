import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  cities: "business-outline",
  add: "add-circle-outline",
  map: "map-outline",
  management: "grid-outline",
  settings: "settings-outline",
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons color={color} name={tabIcons[route.name] ?? "ellipse-outline"} size={size} />
        ),
      })}
    >
      <Tabs.Screen name="cities" options={{ title: "Staedte" }} />
      <Tabs.Screen name="add" options={{ title: "Hinzufuegen" }} />
      <Tabs.Screen name="map" options={{ title: "Karte" }} />
      <Tabs.Screen name="management" options={{ title: "Verwaltung" }} />
      <Tabs.Screen name="settings" options={{ title: "Einstellungen" }} />
    </Tabs>
  );
}
