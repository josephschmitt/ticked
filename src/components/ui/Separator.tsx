import { View } from "react-native";

interface SeparatorProps {
  inset?: boolean;
}

export function Separator({ inset = true }: SeparatorProps) {
  return (
    <View
      className={`h-[0.5px] bg-separator dark:bg-separator-dark ${inset ? "ml-[52px]" : ""}`}
    />
  );
}
