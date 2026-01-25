import "../global.css";
import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useNetworkStateInit } from "@/hooks/useNetworkState";
import { useSyncOnReconnect } from "@/hooks/useSyncOnReconnect";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { IOS_BACKGROUNDS } from "@/constants/colors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 2,
    },
  },
});

/**
 * Inner component that uses hooks requiring QueryClientProvider context.
 */
function AppContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Auto-sync on reconnect (requires QueryClientProvider)
  useSyncOnReconnect();

  const contentBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: contentBg,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(setup)" />
        <Stack.Screen name="(main)" />
      </Stack>
      <ToastContainer />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const hydrateConfig = useConfigStore((state) => state.hydrate);
  const hydrateTaskCache = useTaskCacheStore((state) => state.hydrate);
  const hydrateMutationQueue = useMutationQueueStore((state) => state.hydrate);

  // Initialize network state monitoring (does not require QueryClient)
  useNetworkStateInit();

  // Hydrate stores on app start
  useEffect(() => {
    Promise.all([
      hydrateAuth(),
      hydrateConfig(),
      hydrateTaskCache(),
      hydrateMutationQueue(),
    ]);
  }, [hydrateAuth, hydrateConfig, hydrateTaskCache, hydrateMutationQueue]);

  // Set system UI background color based on theme (iOS grouped background)
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(
      isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light
    );
  }, [isDark]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
