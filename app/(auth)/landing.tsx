import { useState, useCallback } from "react";
import { View, Text, Pressable, ActivityIndicator, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircle2 } from "lucide-react-native";
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getOAuthCallbackUrl,
} from "@/services/auth/oauth";
import { useAuthStore } from "@/stores/authStore";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

export default function LandingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fontSize } = useMacSizing();

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
    <SafeAreaView className="flex-1 bg-background-primary dark:bg-background-dark-primary">
      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-8">
          <CheckCircle2
            size={64}
            color={BRAND_COLORS.primary}
            strokeWidth={1.5}
          />
        </View>

        <Text className="text-4xl font-bold text-label-primary dark:text-label-dark-primary mb-4 text-center">
          Ticked
        </Text>

        <Text className="text-lg text-label-secondary dark:text-label-dark-secondary text-center mb-12 px-4">
          A native todo experience powered by your Notion workspace
        </Text>

        {error && (
          <View className="mb-6 px-4 py-3 bg-ios-red/10 rounded-[10px]">
            <Text className="text-ios-red text-center">
              {error}
            </Text>
          </View>
        )}

        <Pressable
          className="px-8 py-4 rounded-[10px] flex-row items-center active:opacity-80"
          style={{ backgroundColor: BRAND_COLORS.primary }}
          onPress={handleConnect}
          disabled={isLoading}
        >
          {isLoading && (
            <ActivityIndicator color="white" style={{ marginRight: 8 }} />
          )}
          <Text className="text-white font-semibold" style={{ fontSize: fontSize.body }}>
            {isLoading ? "Connecting..." : "Connect to Notion"}
          </Text>
        </Pressable>

        <Text
          className="mt-8 text-label-tertiary dark:text-label-dark-tertiary text-center px-8"
          style={{ fontSize: fontSize.caption }}
        >
          You'll be redirected to Notion to authorize access to your workspace
        </Text>
      </View>
    </SafeAreaView>
  );
}
