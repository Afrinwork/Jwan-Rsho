import { useState } from "react";
import { TextInputProps } from "react-native";

import { AppInput } from "@/src/components/ui/AppInput";
import { parseDecimalInput } from "@/src/utils/parseDecimalInput";

type DecimalInputProps = Omit<TextInputProps, "value" | "onChangeText" | "keyboardType"> & {
  value: number;
  onChangeValue: (value: number) => void;
  // Shows an empty field instead of "0" (the placeholder shows through).
  emptyWhenZero?: boolean;
};

function format(value: number, emptyWhenZero: boolean) {
  return value === 0 && emptyWhenZero ? "" : String(value);
}

// Keeps the typed text instead of re-rendering the parsed number: with the
// number alone, "1," became "1" right away and 1,5 could never be typed
// (it turned into 15). Text that isn't a number yet doesn't change the value.
export function DecimalInput({ value, onChangeValue, emptyWhenZero = false, ...props }: DecimalInputProps) {
  const [text, setText] = useState(() => format(value, emptyWhenZero));
  // A value changed from outside (stepper buttons, form reset) replaces the
  // text; the value this field just reported itself doesn't.
  const [shownValue, setShownValue] = useState(value);
  if (value !== shownValue) {
    setShownValue(value);
    if (value !== parseDecimalInput(text)) setText(format(value, emptyWhenZero));
  }

  return (
    <AppInput
      {...props}
      keyboardType="decimal-pad"
      onChangeText={(next) => {
        setText(next);
        const parsed = parseDecimalInput(next);
        if (parsed !== null) onChangeValue(parsed);
      }}
      value={text}
    />
  );
}
