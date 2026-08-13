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
import { useTranslation } from "react-i18next";

import { useThemeColors } from "@/src/hooks/useThemeColors";
import { typography } from "@/src/theme/typography";

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
  const { t } = useTranslation("navigation");

  return (
    <Tabs
      screenOptions={({ route }) => {
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarLabelStyle: {
            ...typography.caption,
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
      <Tabs.Screen name="overview" options={{ title: t("tabs.overview") }} />
      <Tabs.Screen name="map" options={{ title: t("tabs.map") }} />
      <Tabs.Screen name="add" options={{ title: t("tabs.add") }} />
      <Tabs.Screen name="cities" options={{ title: t("tabs.cities") }} />
      <Tabs.Screen name="management" options={{ title: t("tabs.management") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
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
    height: 68,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 8,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 8,
    overflow: "hidden",
  },
});
