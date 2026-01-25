import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateConfig = useConfigStore((state) => state.hydrate);

  // Hydrate stores on app start
  useEffect(() => {
    Promise.all([hydrateAuth(), hydrateConfig()]);
  }, [hydrateAuth, hydrateConfig]);

  // Set system UI background color based on theme
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      colorScheme === "dark" ? "#000000" : "#ffffff"
    );
  }, [colorScheme]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
            },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(setup)" />
          <Stack.Screen name="(main)" />
        </Stack>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
