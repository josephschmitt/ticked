import { Redirect } from "expo-router";
import { View, Text, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";

export default function Index() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { isConfigured, isLoading: configLoading } = useConfigStore();

  // Show loading state while checking auth/config
  if (authLoading || configLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">Loading...</Text>
      </View>
    );
  }

  // Not authenticated -> go to landing page
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/landing" />;
  }

  // Authenticated but not configured -> go to database selection
  if (!isConfigured) {
    return <Redirect href="/(setup)/databases" />;
  }

  // Fully configured -> go to main task list
  return <Redirect href="/(main)" />;
}
