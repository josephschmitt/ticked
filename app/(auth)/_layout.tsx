import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { IOS_BACKGROUNDS } from "@/constants/colors";

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const contentBg = isDark ? IOS_BACKGROUNDS.primary.dark : IOS_BACKGROUNDS.primary.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: contentBg },
      }}
    >
      <Stack.Screen name="landing" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}
