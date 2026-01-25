import { View, useColorScheme } from "react-native";

interface SeparatorProps {
  inset?: boolean;
}

export function Separator({ inset = true }: SeparatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className={`py-0.5 ${inset ? "ml-[78px] mr-7" : ""}`}>
      <View
        style={{
          height: 1,
          backgroundColor: isDark ? "rgba(84,84,88,0.25)" : "rgba(60,60,67,0.12)",
        }}
      />
    </View>
  );
}
