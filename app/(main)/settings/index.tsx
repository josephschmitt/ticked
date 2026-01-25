import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, X } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { clearNotionClient } from "@/services/notion/client";
import { useQueryClient } from "@tanstack/react-query";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

function SettingsRow({
  label,
  value,
  onPress,
  destructive = false,
  showChevron = true,
  isLast = false,
}: SettingsRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;

  return (
    <>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between py-3 px-4 min-h-[44px] active:opacity-70"
      >
        <Text
          className={`text-[17px] ${
            destructive
              ? "text-ios-red"
              : "text-label-primary dark:text-label-dark-primary"
          }`}
        >
          {label}
        </Text>
        <View className="flex-row items-center">
          {value && (
            <Text className="text-[17px] text-label-secondary dark:text-label-dark-secondary mr-2" numberOfLines={1}>
              {value}
            </Text>
          )}
          {showChevron && !destructive && (
            <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
          )}
        </View>
      </Pressable>
      {!isLast && (
        <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
      )}
    </>
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
        <Text className="text-[13px] font-normal text-label-secondary dark:text-label-dark-secondary uppercase px-4 mb-1.5">
          {title}
        </Text>
      )}
      <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const workspaceName = useAuthStore((state) => state.workspaceName);
  const clearConfig = useConfigStore((state) => state.clearConfig);
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const customListName = useConfigStore((state) => state.customListName);

  const handleChangeDatabase = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings/databases");
  }, [router]);

  const handleReconfigureFields = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings/field-mapping");
  }, [router]);

  const handleChangeListName = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings/list-name");
  }, [router]);

  const handleDismiss = useCallback(() => {
    Haptics.selectionAsync();
    router.dismiss();
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
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text className="mt-4 text-label-secondary dark:text-label-dark-secondary">
            Signing out...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Settings",
          headerLeft: () => (
            <Pressable
              onPress={handleDismiss}
              className="p-2"
              hitSlop={8}
            >
              <X size={22} color={BRAND_COLORS.primary} strokeWidth={2} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20 }}>
          {/* Account Section */}
        <SettingsSection title="Account">
          <SettingsRow
            label="Workspace"
            value={workspaceName || "Unknown"}
            onPress={() => {}}
            showChevron={false}
            isLast
          />
        </SettingsSection>

        {/* Configuration Section */}
        <SettingsSection title="Configuration">
          <SettingsRow
            label="Database"
            value={databaseName || "Not selected"}
            onPress={handleChangeDatabase}
          />
          <SettingsRow
            label="List Name"
            value={customListName || databaseName || "Not set"}
            onPress={handleChangeListName}
          />
          <SettingsRow
            label="Field Mapping"
            onPress={handleReconfigureFields}
            isLast
          />
        </SettingsSection>

        {/* Actions Section */}
        <SettingsSection>
          <SettingsRow
            label="Sign Out"
            onPress={handleSignOut}
            destructive
            showChevron={false}
            isLast
          />
        </SettingsSection>

        {/* Version info */}
        <View className="items-center mt-8">
          <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
            Ticked v1.0.0
          </Text>
        </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
