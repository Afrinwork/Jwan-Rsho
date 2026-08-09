import {
  AddCircle20Regular,
  AppsList20Regular,
  Building20Regular,
  Home20Regular,
  Map20Regular,
  Settings20Regular,
} from "@fluentui/react-native-icons";
import { Tabs } from "expo-router";
import { ComponentType } from "react";
import { StyleSheet } from "react-native";

import { useThemeColors } from "@/src/hooks/useThemeColors";

type TabIconProps = {
  color: string;
  size: number;
};

const tabIcons: Record<string, ComponentType<TabIconProps>> = {
  overview: Home20Regular,
  cities: Home20Regular,
  add: AddCircle20Regular,
  map: Map20Regular,
  management: AppsList20Regular,
  settings: Settings20Regular,
};

export default function TabsLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={({ route }) => {
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "700",
            marginTop: 2,
            marginBottom: 0,
          },
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: colors.surfaceElevated,
              borderTopColor: colors.border,
              shadowColor: colors.shadow,
            },
          ],
          tabBarItemStyle: {
            borderRadius: 0,
            marginHorizontal: 0,
            marginTop: 4,
            marginBottom: 2,
            paddingVertical: 2,
          },
          tabBarIcon: ({ color, size }: TabIconProps) => {
            const Icon = route.name === "cities" ? Building20Regular : tabIcons[route.name] ?? AppsList20Regular;
            return <Icon color={color} size={17} />;
          },
        };
      }}
    >
      <Tabs.Screen name="overview" options={{ title: "Uebersicht" }} />
      <Tabs.Screen name="map" options={{ title: "Karte" }} />
      <Tabs.Screen name="add" options={{ title: "Hinzufuegen" }} />
      <Tabs.Screen name="cities" options={{ title: "Staedte" }} />
      <Tabs.Screen name="management" options={{ title: "Verwalten" }} />
      <Tabs.Screen name="settings" options={{ title: "Einstellungen" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 14,
    borderTopWidth: 1,
    height: 64,
    paddingTop: 4,
    paddingBottom: 4,
    paddingHorizontal: 6,
    borderRadius: 22,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
    overflow: "hidden",
  },
});
