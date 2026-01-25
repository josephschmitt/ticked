import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: "Tasks" }}
      />
      <Stack.Screen
        name="settings"
        options={{ title: "Settings", presentation: "modal" }}
      />
    </Stack>
  );
}
