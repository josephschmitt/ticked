import { useCallback, useState, useEffect } from "react";
import { View, ScrollView, Text, useColorScheme, useWindowDimensions, Pressable, Linking, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTask } from "@/hooks/queries/useTask";
import { usePageContent } from "@/hooks/queries/usePageContent";
import { TaskDetailHeader } from "@/components/tasks/TaskDetailHeader";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { IOS_BACKGROUNDS, BRAND_COLORS } from "@/constants/colors";

// Threshold for considering the sheet "full screen" (percentage of screen height)
const FULL_SCREEN_THRESHOLD = 0.7;

// Format date for timestamp display
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { height: screenHeight } = useWindowDimensions();

  // Track whether sheet is in full screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get task from cache or fetch from server
  const { task, isLoading, isError } = useTask(id);

  // Fetch page content
  const { data: blocks, isLoading: isLoadingContent } = usePageContent(id);

  const groupedBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const elevatedBg = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;

  // Handle long press to open in Notion
  const handleLongPress = useCallback(() => {
    if (task?.notionUrl) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Linking.openURL(task.notionUrl);
    }
  }, [task?.notionUrl]);

  // Track scroll/layout to determine if we're in full screen mode
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const viewHeight = event.nativeEvent.layout.height;
      const ratio = viewHeight / screenHeight;
      setIsFullScreen(ratio > FULL_SCREEN_THRESHOLD);
    },
    [screenHeight]
  );

  // Navigate back if fetch failed (task not found)
  useEffect(() => {
    if (isError) {
      router.back();
    }
  }, [isError]);

  // Show loading state while fetching
  if (!task) {
    return (
      <View style={{ flex: 1, backgroundColor: groupedBg }}>
        <View style={{ paddingTop: 100, alignItems: "center" }}>
          {isLoading && <ActivityIndicator size="large" color={BRAND_COLORS.primary} />}
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={{ flex: 1, backgroundColor: groupedBg }}
      onLayout={handleLayout}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      {/* Header only visible when full screen */}
      {isFullScreen && <TaskDetailHeader title="Task" saveDisabled />}

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            backgroundColor: elevatedBg,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <TaskDetailContent
            mode="edit"
            task={task}
            blocks={blocks}
            isLoadingContent={isLoadingContent}
            isFullScreen={isFullScreen}
          />
        </View>

        {/* Timestamps */}
        <View className="px-6 pt-4">
          {task.creationDate && (
            <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary mb-1">
              Created {formatTimestamp(task.creationDate)}
            </Text>
          )}
          <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary mb-1">
            Updated {formatTimestamp(task.lastEditedTime)}
          </Text>
          {task.status.group === "complete" && task.completedDate && (
            <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
              Completed {formatTimestamp(task.completedDate)}
            </Text>
          )}
        </View>
      </ScrollView>
    </Pressable>
  );
}
