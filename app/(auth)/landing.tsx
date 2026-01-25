import { useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getOAuthCallbackUrl,
} from "@/services/auth/oauth";
import { useAuthStore } from "@/stores/authStore";

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

export default function LandingScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The worker's callback URL (used for Notion redirect_uri)
  const workerCallbackUrl = getOAuthCallbackUrl();

  const handleConnect = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Build auth URL and open in browser
      // Notion redirects to worker, worker redirects to ticked://oauth/callback
      const authUrl = buildAuthorizationUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        "ticked://oauth/callback"
      );

      if (result.type === "success" && result.url) {
        // Parse the callback URL (ticked://oauth/callback?code=xxx)
        const url = new URL(result.url);
        const code = url.searchParams.get("code");
        const errorParam = url.searchParams.get("error");

        if (errorParam) {
          throw new Error(`Authorization failed: ${errorParam}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Exchange code for tokens (use worker callback URL as redirect_uri)
        const tokens = await exchangeCodeForTokens(code, workerCallbackUrl);

        // Store auth data
        await setAuth({
          accessToken: tokens.accessToken,
          workspaceId: tokens.workspaceId,
          workspaceName: tokens.workspaceName,
          botId: tokens.botId,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate to database selection
        router.replace("/(setup)/databases");
      } else if (result.type === "cancel") {
        // User cancelled - no error, just reset loading
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  }, [workerCallbackUrl, setAuth, router]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8">
          <Text className="text-5xl text-center mb-2">✓</Text>
        </View>

        <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
          Ticked
        </Text>

        <Text className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12 px-4">
          A native todo experience powered by your Notion workspace
        </Text>

        {error && (
          <View className="mb-6 px-4 py-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Text className="text-red-600 dark:text-red-400 text-center">
              {error}
            </Text>
          </View>
        )}

        <Pressable
          className="bg-primary-600 px-8 py-4 rounded-xl active:bg-primary-700 disabled:opacity-50 flex-row items-center"
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" className="mr-2" />
          ) : null}
          <Text className="text-white text-lg font-semibold">
            {isLoading ? "Connecting..." : "Connect to Notion"}
          </Text>
        </Pressable>

        <Text className="mt-8 text-sm text-gray-500 dark:text-gray-500 text-center px-8">
          You'll be redirected to Notion to authorize access to your workspace
        </Text>
      </View>
    </SafeAreaView>
  );
}
