import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { BRAND_COLORS, IOS_BACKGROUNDS } from "@/constants/colors";

export default function SetupLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const headerBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const contentBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: BRAND_COLORS.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: contentBg },
      }}
    >
      <Stack.Screen name="databases" options={{ title: "Select Database" }} />
      <Stack.Screen name="field-mapping" options={{ title: "Configure Fields" }} />
    </Stack>
  );
}
