import { Component, ErrorInfo, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { t } from "@/src/i18n/i18n";
import { spacing } from "@/src/theme/spacing";

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] prevented app crash", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <AppCrashFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

function AppCrashFallback({ onRetry }: { onRetry: () => void }) {
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
});
