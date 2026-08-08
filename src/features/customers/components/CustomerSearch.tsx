import { SearchInput } from "@/src/components/ui/SearchInput";

type CustomerSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function CustomerSearch({ query, onQueryChange }: CustomerSearchProps) {
  return (
    <SearchInput
      onChangeText={onQueryChange}
      placeholder="Name, Telefon, Stadt oder Strasse"
      value={query}
    />
  );
}
