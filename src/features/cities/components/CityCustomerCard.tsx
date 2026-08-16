import { StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { AppCard } from "@/src/components/ui/AppCard";
import { AppText } from "@/src/components/ui/AppText";
import { spacing } from "@/src/theme/spacing";
import { formatAddress } from "@/src/utils/formatAddress";

import { CityCustomerActions } from "@/src/features/cities/components/CityCustomerActions";
import { CityCustomerItem } from "@/src/features/cities/types/cityCustomerTypes";

type CityCustomerCardProps = {
  customer: CityCustomerItem;
  selected: boolean;
  completing: boolean;
  onComplete: () => void;
  onToggleSelection: () => void;
  onPressDetails: () => void;
};

export function CityCustomerCard(props: CityCustomerCardProps) {
  const { t } = useTranslation("cities");

  return (
    <AppCard contentStyle={styles.card} frosted>
      <AppText style={styles.name} variant="subheading">
        {props.customer.fullName}
      </AppText>
      <AppText color="muted" style={styles.meta} variant="body">
        {props.customer.phone}
      </AppText>
      <AppText color="muted" style={styles.meta} variant="body">
        {formatAddress([props.customer.address, props.customer.city])}
      </AppText>
      <AppText color="muted" style={styles.meta} variant="body">
        {props.customer.currentOpenOrderLabel ?? t("customerList.noOpenOrder")}
      </AppText>
      <AppText color={statusColor(props.customer.status)} style={styles.status} variant="bodyMedium">
        {labelForStatus(props.customer.status, t)}
      </AppText>
      <CityCustomerActions canComplete={Boolean(props.customer.currentOpenOrderId)} completing={props.completing} onComplete={props.onComplete} onPressDetails={props.onPressDetails} onToggleSelection={props.onToggleSelection} selected={props.selected} />
    </AppCard>
  );
}

function labelForStatus(status: CityCustomerItem["status"], t: (key: string) => string) {
  if (status === "open") {
    return t("customerStatus.open");
  }

  if (status === "completed") {
    return t("customerStatus.completed");
  }

  return t("customerStatus.noOpenOrder");
}

function statusColor(status: CityCustomerItem["status"]) {
  if (status === "open") {
    return "danger";
  }

  if (status === "completed") {
    return "success";
  }

  return "muted";
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: 6,
  },
  name: {},
  meta: {},
  status: {},
});
