import { Component, ErrorInfo, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/src/components/ui/AppButton";
import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
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
            Stabil weiterarbeiten
          </AppText>
          <AppText variant="title">Die Ansicht wurde sicher angehalten.</AppText>
          <AppText color="muted" variant="body">
            Ein Oberflaechenfehler wurde abgefangen, damit die App nicht komplett abstuerzt.
            Du kannst die Ansicht direkt neu laden.
          </AppText>
          <AppButton label="Erneut laden" onPress={onRetry} />
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
