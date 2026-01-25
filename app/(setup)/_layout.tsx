import { Stack } from "expo-router";

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Back",
      }}
    >
      <Stack.Screen name="databases" options={{ title: "Select Database" }} />
      <Stack.Screen name="field-mapping" options={{ title: "Configure Fields" }} />
    </Stack>
  );
}
