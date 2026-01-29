import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Switch,
  useColorScheme,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useConfigStore } from "@/stores/configStore";
import { useStatuses } from "@/hooks/queries/useTasks";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";
import type { TaskStatus } from "@/types/task";

interface StatusToggleRowProps {
  status: TaskStatus;
  isVisible: boolean;
  onToggle: (statusId: string, visible: boolean) => void;
  isLast?: boolean;
  disabled?: boolean;
}

function StatusToggleRow({
  status,
  isVisible,
  onToggle,
  isLast = false,
  disabled = false,
}: StatusToggleRowProps) {
  const { fontSize, spacing, minHeight } = useMacSizing();

  const handleValueChange = useCallback(
    (value: boolean) => {
      Haptics.selectionAsync();
      onToggle(status.id, value);
    },
    [status.id, onToggle]
  );

  return (
    <>
      <View
        className="flex-row items-center justify-between"
        style={{
          paddingVertical: spacing.rowPaddingVertical * 0.66,
          paddingHorizontal: spacing.rowPaddingHorizontal,
          minHeight: minHeight.row,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View className="flex-row items-center flex-1 mr-3">
          <View
            className="w-3 h-3 rounded-full mr-3"
            style={{ backgroundColor: status.color }}
          />
          <Text
            className="text-label-primary dark:text-label-dark-primary flex-1"
            style={{ fontSize: fontSize.body }}
            numberOfLines={1}
          >
            {status.name}
          </Text>
        </View>
        <Switch
          value={isVisible}
          onValueChange={handleValueChange}
          trackColor={{ true: BRAND_COLORS.primary }}
          disabled={disabled}
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
  footer,
  children,
}: {
  title?: string;
  footer?: string;
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
      {footer && (
        <Text className="text-[13px] font-normal text-label-secondary dark:text-label-dark-secondary px-4 mt-1.5">
          {footer}
        </Text>
      )}
    </View>
  );
}

export default function StatusVisibilityScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const hiddenStatusIds = useConfigStore((state) => state.hiddenStatusIds);
  const setHiddenStatusIds = useConfigStore((state) => state.setHiddenStatusIds);

  const { data: statuses, isLoading } = useStatuses();

  // Filter to only show active (non-complete) statuses
  const activeStatuses = useMemo(
    () => statuses?.filter((s) => s.group !== "complete") || [],
    [statuses]
  );

  // Count visible statuses
  const visibleCount = useMemo(() => {
    const hiddenSet = new Set(hiddenStatusIds);
    return activeStatuses.filter((s) => !hiddenSet.has(s.id)).length;
  }, [activeStatuses, hiddenStatusIds]);

  const handleToggle = useCallback(
    async (statusId: string, visible: boolean) => {
      const hiddenSet = new Set(hiddenStatusIds);

      if (visible) {
        // Show the status (remove from hidden)
        hiddenSet.delete(statusId);
      } else {
        // Check if this would hide the last visible status
        const wouldBeVisibleCount = activeStatuses.filter(
          (s) => !hiddenSet.has(s.id) && s.id !== statusId
        ).length;

        if (wouldBeVisibleCount === 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert(
            "Cannot Hide Status",
            "At least one status must remain visible."
          );
          return;
        }

        // Hide the status (add to hidden)
        hiddenSet.add(statusId);
      }

      await setHiddenStatusIds(Array.from(hiddenSet));
    },
    [hiddenStatusIds, activeStatuses, setHiddenStatusIds]
  );

  const hiddenSet = useMemo(() => new Set(hiddenStatusIds), [hiddenStatusIds]);

  if (isLoading || !statuses) {
    return (
      <SafeAreaView
        className="flex-1 bg-background-grouped dark:bg-background-dark-grouped"
        edges={["bottom"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-label-secondary dark:text-label-dark-secondary">
            Loading statuses...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-background-grouped dark:bg-background-dark-grouped"
      edges={["bottom"]}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20 }}>
        <SettingsSection
          title="Active Statuses"
          footer="Hidden statuses and their tasks won't appear in the task list. At least one status must remain visible."
        >
          {activeStatuses.map((status, index) => {
            const isVisible = !hiddenSet.has(status.id);
            const isLastVisible = isVisible && visibleCount === 1;

            return (
              <StatusToggleRow
                key={status.id}
                status={status}
                isVisible={isVisible}
                onToggle={handleToggle}
                isLast={index === activeStatuses.length - 1}
                disabled={isLastVisible}
              />
            );
          })}
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
