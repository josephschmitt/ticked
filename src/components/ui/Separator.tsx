import { View } from "react-native";

interface SeparatorProps {
  inset?: boolean;
}

export function Separator({ inset = true }: SeparatorProps) {
  return (
    <View className={`py-px ${inset ? "ml-[56px] mr-6" : ""}`}>
      <View className="h-[0.5px] bg-separator dark:bg-separator-dark" />
    </View>
  );
}
