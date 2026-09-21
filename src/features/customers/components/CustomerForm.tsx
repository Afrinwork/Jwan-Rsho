import { Control, Controller, FieldErrors } from "react-hook-form";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { DismissCircle20Regular } from "@fluentui/react-native-icons";

import { AppInput } from "@/src/components/ui/AppInput";
import { FormField } from "@/src/components/forms/FormField";
import { spacing } from "@/src/constants/spacing";
import { CustomerMatch } from "@/src/features/customers/hooks/useDuplicateCustomerCheck";
import { CustomerSuggestionList } from "@/src/features/customers/components/CustomerSuggestionList";
import { AddOrderFormValues } from "@/src/features/orders/validation/addOrderFormSchema";
import { useThemeColors } from "@/src/hooks/useThemeColors";
import { Customer } from "@/src/types/customer";

type CustomerFormProps = {
  control: Control<AddOrderFormValues>;
  errors?: FieldErrors<AddOrderFormValues>["customer"];
  suggestions: CustomerMatch[];
  selectedCustomer: Customer | null;
  onSelectSuggestion: (customer: Customer) => void;
  onClearSelection: () => void;
};

export function CustomerForm({
  control,
  errors,
  suggestions,
  selectedCustomer,
  onSelectSuggestion,
  onClearSelection,
}: CustomerFormProps) {
  const { t } = useTranslation("customers");
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.column}>
          <FormField error={errors?.fullName?.message} label={t("form.nameLabel")}>
            <View style={styles.inputWrap}>
              <Controller
                control={control}
                name="customer.fullName"
                render={({ field }) => (
                  <AppInput
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                    placeholder={t("form.namePlaceholder")}
                    style={selectedCustomer ? styles.inputWithClear : undefined}
                    value={field.value ?? ""}
                  />
                )}
              />
              {selectedCustomer ? (
                <Pressable hitSlop={8} onPress={onClearSelection} style={styles.clearButton}>
                  <DismissCircle20Regular color={colors.mutedText} />
                </Pressable>
              ) : null}
            </View>
          </FormField>
        </View>
        <View style={styles.column}>
          <FormField error={errors?.phone?.message} label={t("form.phoneLabel")}>
            <Controller
              control={control}
              name="customer.phone"
              render={({ field }) => (
                <AppInput
                  keyboardType="phone-pad"
                  onBlur={field.onBlur}
                  onChangeText={field.onChange}
                  placeholder={t("form.phonePlaceholder")}
                  value={field.value ?? ""}
                />
              )}
            />
          </FormField>
        </View>
      </View>
      <CustomerSuggestionList matches={suggestions} onSelect={onSelectSuggestion} />
      <FormField error={errors?.note?.message} label={t("form.noteLabel")}>
        <Controller
          control={control}
          name="customer.note"
          render={({ field }) => (
            <AppInput
              multiline
              numberOfLines={3}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              placeholder={t("form.notePlaceholder")}
              style={styles.noteInput}
              value={field.value ?? ""}
            />
          )}
        />
      </FormField>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  column: {
    flex: 1,
  },
  inputWrap: {
    justifyContent: "center",
  },
  inputWithClear: {
    paddingRight: 40,
  },
  clearButton: {
    position: "absolute",
    right: spacing.sm,
  },
  noteInput: {
    minHeight: 64,
    textAlignVertical: "top",
  },
});
