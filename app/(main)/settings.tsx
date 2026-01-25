import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { clearNotionClient } from "@/services/notion/client";
import { useQueryClient } from "@tanstack/react-query";

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  showChevron = true,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 active:opacity-80"
    >
      <Text
        className={`text-base ${
          destructive
            ? "text-red-600 dark:text-red-400"
            : "text-gray-900 dark:text-white"
        }`}
      >
        {label}
      </Text>
      <View className="flex-row items-center">
        {value && (
          <Text className="text-gray-500 dark:text-gray-400 mr-2" numberOfLines={1}>
            {value}
          </Text>
        )}
        {showChevron && !destructive && (
          <Text className="text-gray-400">›</Text>
        )}
      </View>
    </Pressable>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      {title && (
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 mb-2">
          {title}
        </Text>
      )}
      <View className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
        {children}
      </View>
    </View>
  );
}

function Divider() {
  return <View className="h-px bg-gray-200 dark:bg-gray-700 ml-4" />;
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const workspaceName = useAuthStore((state) => state.workspaceName);
  const clearConfig = useConfigStore((state) => state.clearConfig);
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);

  const handleChangeDatabase = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(setup)/databases");
  }, [router]);

  const handleReconfigureFields = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(setup)/field-mapping");
  }, [router]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out? You'll need to reconnect to Notion to use the app again.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setIsSigningOut(true);
            try {
              // Clear all data
              await clearConfig();
              await clearAuth();
              clearNotionClient();
              queryClient.clear();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Navigate to landing
              router.replace("/(auth)/landing");
            } catch (error) {
              console.error("Sign out error:", error);
              setIsSigningOut(false);
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  }, [clearAuth, clearConfig, queryClient, router]);

  if (isSigningOut) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Signing out...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={["bottom"]}>
      <ScrollView className="flex-1 px-4 py-6">
        {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsRow
            label="Workspace"
            value={workspaceName || "Unknown"}
            onPress={() => {}}
            showChevron={false}
          />
        </SettingsSection>

        {/* Configuration Section */}
        <SettingsSection title="Configuration">
          <SettingsRow
            label="Database"
            value={databaseName || "Not selected"}
            onPress={handleChangeDatabase}
          />
          <Divider />
          <SettingsRow
            label="Field Mapping"
            onPress={handleReconfigureFields}
          />
        </SettingsSection>

        {/* Actions Section */}
        <SettingsSection>
          <SettingsRow
            label="Sign Out"
            onPress={handleSignOut}
            destructive
            showChevron={false}
          />
        </SettingsSection>

        {/* Version info */}
        <View className="items-center mt-8">
          <Text className="text-xs text-gray-400 dark:text-gray-500">
            Ticked v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
