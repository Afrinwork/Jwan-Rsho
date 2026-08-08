import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { colors } from "@/src/constants/colors";
import { spacing } from "@/src/constants/spacing";
import { routes } from "@/src/constants/routes";

import { CitySummary } from "@/src/features/cities/types/cityTypes";

type CityCardProps = {
  city: CitySummary;
};

export function CityCard({ city }: CityCardProps) {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push(`${routes.admin.replace("/admin", "/city")}/${city.normalizedName}`)}>
      <View style={styles.card}>
      <Text style={styles.title}>{city.name}</Text>
      <Text style={styles.meta}>{city.country}</Text>
      <Text style={styles.meta}>{city.customerCount} Kunden</Text>
      <Text style={styles.meta}>{city.openOrderCount} offene Bestellungen</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  meta: {
    color: colors.mutedText,
    fontSize: 14,
  },
});
