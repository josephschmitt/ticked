import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
  useColorScheme,
  ActionSheetIOS,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, Stack } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight, X } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { useConfigStore } from "@/stores/configStore";
import { useTaskCacheStore } from "@/stores/taskCacheStore";
import { useStatuses } from "@/hooks/queries/useTasks";
import { useDatabaseSchema } from "@/hooks/queries/useDatabaseSchema";
import { useRelationOptions } from "@/hooks/queries/useRelationOptions";
import { clearNotionClient } from "@/services/notion/client";
import { useQueryClient } from "@tanstack/react-query";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

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
  const { fontSize, spacing, minHeight, iconSize } = useMacSizing();
  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;

  return (
    <>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between active:opacity-70"
        style={{
          paddingVertical: spacing.rowPaddingVertical,
          paddingHorizontal: spacing.rowPaddingHorizontal,
          minHeight: minHeight.row,
        }}
      >
        <Text
          className={
            destructive
              ? "text-ios-red"
              : "text-label-primary dark:text-label-dark-primary"
          }
          style={{ fontSize: fontSize.body }}
        >
          {label}
        </Text>
        <View className="flex-row items-center">
          {value && (
            <Text
              className="text-label-secondary dark:text-label-dark-secondary mr-2"
              style={{ fontSize: fontSize.body }}
              numberOfLines={1}
            >
              {value}
            </Text>
          )}
          {showChevron && !destructive && (
            <ChevronRight size={iconSize.medium} color={chevronColor} strokeWidth={2} />
          )}
        </View>
      </Pressable>
      {!isLast && (
        <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
      )}
    </>
  );
}

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

function SettingsToggleRow({
  label,
  value,
  onValueChange,
  isLast = false,
}: SettingsToggleRowProps) {
  const { fontSize, spacing, minHeight } = useMacSizing();

  return (
    <>
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingVertical: spacing.rowPaddingVertical * 0.66,
          paddingHorizontal: spacing.rowPaddingHorizontal,
          minHeight: minHeight.row,
        }}
      >
        <Text
          className="text-label-primary dark:text-label-dark-primary"
          style={{ fontSize: fontSize.body }}
        >
          {label}
        </Text>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: BRAND_COLORS.primary }}
        />
      </View>
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
  const clearTaskCache = useTaskCacheStore((state) => state.clearCache);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const customListName = useConfigStore((state) => state.customListName);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const showTaskTypeInline = useConfigStore((state) => state.showTaskTypeInline);
  const setShowTaskTypeInline = useConfigStore((state) => state.setShowTaskTypeInline);
  const approachingDaysThreshold = useConfigStore((state) => state.approachingDaysThreshold);
  const setApproachingDaysThreshold = useConfigStore((state) => state.setApproachingDaysThreshold);
  const defaultStatusId = useConfigStore((state) => state.defaultStatusId);
  const setDefaultStatusId = useConfigStore((state) => state.setDefaultStatusId);
  const defaultTaskTypeId = useConfigStore((state) => state.defaultTaskTypeId);

  // Get available statuses for the default status picker
  const { data: statuses } = useStatuses();
  const todoStatuses = statuses?.filter((s) => s.group === "todo" || s.group === "inProgress") || [];

  // Get task type options for displaying the current default label
  const hasTaskTypeField = !!fieldMapping?.taskType;
  const { data: schema } = useDatabaseSchema(hasTaskTypeField ? databaseId : null);
  const taskTypeProperty = schema?.properties.find((p) => p.id === fieldMapping?.taskType);
  const { data: taskTypeRelationOptions } = useRelationOptions(
    taskTypeProperty?.type === "relation" ? taskTypeProperty.relationDatabaseId : undefined
  );

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

  const handleChangeStatusVisibility = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings/status-visibility");
  }, [router]);

  const handleToggleTaskTypeInline = useCallback((value: boolean) => {
    Haptics.selectionAsync();
    setShowTaskTypeInline(value);
  }, [setShowTaskTypeInline]);

  const approachingDaysOptions = [
    { label: "Never", value: -1 },
    { label: "Same day only", value: 0 },
    { label: "1 day", value: 1 },
    { label: "2 days", value: 2 },
    { label: "3 days", value: 3 },
    { label: "5 days", value: 5 },
    { label: "1 week", value: 7 },
  ];

  const getApproachingDaysLabel = (days: number) => {
    const option = approachingDaysOptions.find(o => o.value === days);
    return option?.label || `${days} days`;
  };

  const handleChangeApproachingDays = useCallback(() => {
    Haptics.selectionAsync();
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...approachingDaysOptions.map(o => o.label), "Cancel"],
          cancelButtonIndex: approachingDaysOptions.length,
          title: "Upcoming Warning Threshold",
          message: "Show dates in yellow when they are within this time range",
        },
        (buttonIndex) => {
          if (buttonIndex < approachingDaysOptions.length) {
            setApproachingDaysThreshold(approachingDaysOptions[buttonIndex].value);
          }
        }
      );
    } else {
      // For Android, use Alert with buttons as a fallback
      Alert.alert(
        "Upcoming Warning Threshold",
        "Show dates in yellow when they are within this time range",
        [
          ...approachingDaysOptions.map((option) => ({
            text: option.label,
            onPress: () => setApproachingDaysThreshold(option.value),
          })),
          { text: "Cancel", style: "cancel" as const },
        ]
      );
    }
  }, [setApproachingDaysThreshold]);

  const getDefaultStatusLabel = useCallback(() => {
    if (!defaultStatusId) return "Auto (first To-do)";
    const status = statuses?.find((s) => s.id === defaultStatusId);
    return status?.name || "Auto (first To-do)";
  }, [defaultStatusId, statuses]);

  const getDefaultTaskTypeLabel = useCallback(() => {
    if (!defaultTaskTypeId) return "None";

    if (taskTypeProperty?.type === "select") {
      const option = taskTypeProperty.options?.find((o) => o.id === defaultTaskTypeId);
      return option?.name || "None";
    }

    if (taskTypeProperty?.type === "relation") {
      const option = taskTypeRelationOptions?.find((o) => o.id === defaultTaskTypeId);
      return option?.title || "None";
    }

    return "None";
  }, [defaultTaskTypeId, taskTypeProperty, taskTypeRelationOptions]);

  const handleChangeDefaultTaskType = useCallback(() => {
    Haptics.selectionAsync();
    router.push("/(main)/settings/default-task-type");
  }, [router]);

  const handleChangeDefaultStatus = useCallback(() => {
    Haptics.selectionAsync();
    if (todoStatuses.length === 0) return;

    const options = [
      { label: "Auto (first To-do)", value: null },
      ...todoStatuses.map((s) => ({ label: s.name, value: s.id })),
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options.map((o) => o.label), "Cancel"],
          cancelButtonIndex: options.length,
          title: "Default Status",
          message: "Status to use when unchecking completed tasks",
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            setDefaultStatusId(options[buttonIndex].value);
          }
        }
      );
    } else {
      Alert.alert(
        "Default Status",
        "Status to use when unchecking completed tasks",
        [
          ...options.map((option) => ({
            text: option.label,
            onPress: () => setDefaultStatusId(option.value),
          })),
          { text: "Cancel", style: "cancel" as const },
        ]
      );
    }
  }, [todoStatuses, setDefaultStatusId]);

  const handleDismiss = useCallback(() => {
    Haptics.selectionAsync();
    router.dismiss();
  }, [router]);

  const handleClearCache = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Clear Cache",
      "This will clear locally cached tasks and fetch fresh data from Notion.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          style: "destructive",
          onPress: async () => {
            try {
              // Clear the local task cache
              await clearTaskCache();
              // Clear TanStack Query cache to force refetch
              queryClient.clear();

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // Dismiss settings and go back to task list which will refetch
              router.dismiss();
            } catch (error) {
              console.error("Clear cache error:", error);
              Alert.alert("Error", "Failed to clear cache. Please try again.");
            }
          },
        },
      ]
    );
  }, [clearTaskCache, queryClient, router]);

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

        {/* Display Section */}
        <SettingsSection title="Display">
          {hasTaskTypeField && (
            <>
              <SettingsToggleRow
                label="Show Task Type Inline"
                value={showTaskTypeInline}
                onValueChange={handleToggleTaskTypeInline}
              />
              <SettingsRow
                label="Default Task Type"
                value={getDefaultTaskTypeLabel()}
                onPress={handleChangeDefaultTaskType}
              />
            </>
          )}
          <SettingsRow
            label="Status Visibility"
            onPress={handleChangeStatusVisibility}
          />
          <SettingsRow
            label="Upcoming Warning"
            value={getApproachingDaysLabel(approachingDaysThreshold)}
            onPress={handleChangeApproachingDays}
          />
          <SettingsRow
            label="Default Status"
            value={getDefaultStatusLabel()}
            onPress={handleChangeDefaultStatus}
            isLast
          />
        </SettingsSection>

        {/* Actions Section */}
        <SettingsSection>
          <SettingsRow
            label="Clear Cache & Refresh"
            onPress={handleClearCache}
            showChevron={false}
          />
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
