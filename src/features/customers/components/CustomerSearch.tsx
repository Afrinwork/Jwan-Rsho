import { useTranslation } from "react-i18next";

import { SearchInput } from "@/src/components/ui/SearchInput";

type CustomerSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function CustomerSearch({ query, onQueryChange }: CustomerSearchProps) {
  const { t } = useTranslation("customers");

  return (
    <SearchInput
      onChangeText={onQueryChange}
      placeholder={t("search.placeholder")}
      value={query}
    />
  );
}
