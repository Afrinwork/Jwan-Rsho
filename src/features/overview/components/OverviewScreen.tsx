import {
  Board20Regular,
  Box20Regular,
  Building20Regular,
  CheckmarkCircle20Regular,
  City20Regular,
  ClipboardTask20Regular,
} from "@fluentui/react-native-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AnimatedEntrance } from "@/src/components/ui/AnimatedEntrance";
import { CompactScreenHeader } from "@/src/components/ui/CompactScreenHeader";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { LoadingView } from "@/src/components/ui/LoadingView";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { spacing } from "@/src/constants/spacing";
import { OverviewHeroCard } from "@/src/features/overview/components/OverviewHeroCard";
import { OverviewStatCard } from "@/src/features/overview/components/OverviewStatCard";
import { useOverviewStats } from "@/src/features/overview/hooks/useOverviewStats";
import { useThemeColors } from "@/src/hooks/useThemeColors";

export function OverviewScreen() {
  const colors = useThemeColors();
  const { stats, loading, error } = useOverviewStats();
  const motivation = getMotivation(stats.openOrders, stats.completedOrders);

  if (loading) {
    return <LoadingView label="Uebersicht wird geladen..." />;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AnimatedEntrance>
          <CompactScreenHeader subtitle="Dein schneller Blick auf Auftraege, Struktur und Fortschritt." title="Uebersicht" />
        </AnimatedEntrance>
        <AnimatedEntrance delay={50}>
          <OverviewHeroCard
            subtitle={motivation}
            title="Fokus heute"
            value={String(stats.openOrders)}
          />
        </AnimatedEntrance>
        <AnimatedEntrance delay={70}>
          <View style={[styles.messageCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.messageTitle, { color: colors.text }]}>Heute im Blick</Text>
            <Text style={[styles.messageText, { color: colors.mutedText }]}>{buildProgressText(stats.openOrders, stats.completedOrders)}</Text>
          </View>
        </AnimatedEntrance>
        {error ? <AnimatedEntrance delay={80}><ErrorState message={error} /></AnimatedEntrance> : null}
        <AnimatedEntrance delay={100} style={styles.grid}>
          <OverviewStatCard accent="primary" caption="aktiv im Verlauf" icon={ClipboardTask20Regular} title="Offene Bestellungen" value={String(stats.openOrders)} />
          <OverviewStatCard accent="success" caption="bereits abgeschlossen" icon={CheckmarkCircle20Regular} title="Erledigte Bestellungen" value={String(stats.completedOrders)} />
          <OverviewStatCard caption="aktive Struktur" icon={Building20Regular} title="Laender" value={String(stats.countries)} />
          <OverviewStatCard caption="mit Kunden belegt" icon={City20Regular} title="Staedte" value={String(stats.cities)} />
          <OverviewStatCard caption="fuer neue Auftraege" icon={Box20Regular} title="Produkte" value={String(stats.products)} />
          <OverviewStatCard caption="im Bestand" icon={Board20Regular} title="Kunden" value={String(stats.customers)} />
        </AnimatedEntrance>
      </ScrollView>
    </ScreenContainer>
  );
}

function getMotivation(openOrders: number, completedOrders: number) {
  if (openOrders === 0) {
    return "Stark. Aktuell ist keine offene Bestellung mehr uebrig.";
  }

  if (openOrders === 1) {
    return "Nur noch eine offene Bestellung. Das ist fast geschafft.";
  }

  if (completedOrders > openOrders) {
    return `Noch ${openOrders} offene Bestellungen. Du bist bereits sehr gut im Flow.`;
  }

  return `Du hast noch ${openOrders} offene Bestellungen im Blick. Schritt fuer Schritt.`;
}

function buildProgressText(openOrders: number, completedOrders: number) {
  if (openOrders === 0 && completedOrders === 0) {
    return "Sobald die ersten Bestellungen angelegt sind, siehst du hier deinen Fortschritt.";
  }

  if (openOrders === 0) {
    return `${completedOrders} Bestellungen sind bereits erledigt. Heute sieht alles sauber aus.`;
  }

  return `${completedOrders} Bestellungen sind bereits erledigt. ${openOrders} warten noch auf deinen naechsten Schritt.`;
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  messageCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: spacing.md,
    gap: spacing.xs,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  messageTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
