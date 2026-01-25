import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as AuthSession from "expo-auth-session";
import { exchangeCodeForTokens } from "@/services/auth/oauth";
import { useAuthStore } from "@/stores/authStore";

/**
 * OAuth callback screen.
 * This handles the redirect from Notion after authorization.
 * In most cases, the landing screen handles the callback via WebBrowser,
 * but this screen serves as a fallback for deep links.
 */
export default function CallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error?: string }>();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "notiontodos",
    path: "oauth/callback",
  });

  useEffect(() => {
    async function handleCallback() {
      try {
        // Check for error from Notion
        if (params.error) {
          throw new Error(`Authorization failed: ${params.error}`);
        }

        // Check for authorization code
        if (!params.code) {
          // No code yet - might be initial mount before redirect completes
          return;
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(params.code, redirectUri);

        // Store auth data
        await setAuth({
          accessToken: tokens.accessToken,
          workspaceId: tokens.workspaceId,
          workspaceName: tokens.workspaceName,
          botId: tokens.botId,
        });

        // Navigate to database selection
        router.replace("/(setup)/databases");
      } catch (err) {
        console.error("Callback error:", err);
        setError(err instanceof Error ? err.message : "Authentication failed");
      }
    }

    handleCallback();
  }, [params.code, params.error, redirectUri, setAuth, router]);

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 dark:text-red-400 text-lg text-center mb-4">
            {error}
          </Text>
          <Text
            className="text-primary-600 text-lg"
            onPress={() => router.replace("/(auth)/landing")}
          >
            Try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">
          Completing authentication...
        </Text>
      </View>
    </SafeAreaView>
  );
}
