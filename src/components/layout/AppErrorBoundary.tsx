import { Component, ErrorInfo, PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { t } from "@/src/i18n/i18n";
import { spacing } from "@/src/theme/spacing";

type AppErrorBoundaryState = {
  hasError: boolean;
  errorDetails: string | null;
};

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorDetails: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorDetails: `${error.name}: ${error.message}\n${error.stack ?? ""}` };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] prevented app crash", error, errorInfo);
    this.setState((current) => ({
      ...current,
      errorDetails: `${current.errorDetails ?? ""}\n\nComponent stack:${errorInfo.componentStack ?? ""}`,
    }));
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorDetails: null });
  };

  render() {
    if (this.state.hasError) {
      return <AppCrashFallback errorDetails={this.state.errorDetails} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

// TEMPORARY debugging aid: shows the raw error/stack so a crash reported
// from a TestFlight build (no console access) can be read off the screen
// and reported back, instead of guessing blind. Remove once the current
// Firebase->Supabase migration crash hunt is resolved.
function AppCrashFallback({ onRetry, errorDetails }: { onRetry: () => void; errorDetails: string | null }) {
  return (
    <ScreenContainer>
      <View style={styles.shell}>
        <AppCard contentStyle={styles.card} frosted>
          <AppText color="primary" variant="label">
            {t("common:errorBadge")}
          </AppText>
          <AppText variant="title">{t("errors:uiCrashTitle")}</AppText>
          <AppText color="muted" variant="body">
            {t("errors:uiCrashMessage")}
          </AppText>
          {errorDetails ? (
            <ScrollView style={styles.detailsBox}>
              <AppText selectable style={styles.detailsText} variant="caption">
                {errorDetails}
              </AppText>
            </ScrollView>
          ) : null}
          <AppButton label={t("common:retry")} onPress={onRetry} />
        </AppCard>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
  },
  card: {
    padding: spacing.xl,
    gap: spacing.md,
  },
  detailsBox: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#00000022",
    borderRadius: 8,
    padding: spacing.sm,
  },
  detailsText: {
    fontFamily: "monospace",
  },
});
