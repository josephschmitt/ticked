import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { BRAND_COLORS, IOS_BACKGROUNDS } from "@/constants/colors";

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const headerBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const contentBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: headerBg },
        headerTintColor: BRAND_COLORS.primary,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: contentBg },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Tasks" }} />
      <Stack.Screen name="done" options={{ title: "Done" }} />
      <Stack.Screen name="settings" options={{ title: "Settings", presentation: "modal" }} />
    </Stack>
  );
}
