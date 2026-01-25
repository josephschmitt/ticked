import { useCallback, useState, useEffect } from "react";
import { View, ScrollView, useColorScheme, useWindowDimensions, Pressable, Linking } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTask } from "@/hooks/queries/useTask";
import { usePageContent } from "@/hooks/queries/usePageContent";
import { TaskDetailHeader } from "@/components/tasks/TaskDetailHeader";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { IOS_BACKGROUNDS } from "@/constants/colors";

// Threshold for considering the sheet "full screen" (percentage of screen height)
const FULL_SCREEN_THRESHOLD = 0.7;

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { height: screenHeight } = useWindowDimensions();

  // Track whether sheet is in full screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Get task from cache
  const task = useTask(id);

  // Fetch page content
  const { data: blocks, isLoading: isLoadingContent } = usePageContent(id);

  const backgroundColor = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;

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

  // If task not found, go back
  useEffect(() => {
    if (id && !task) {
      // Give the cache a moment to populate
      const timeout = setTimeout(() => {
        if (!task) {
          router.back();
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [id, task]);

  if (!task) {
    return <View style={{ flex: 1, backgroundColor }} />;
  }

  return (
    <Pressable
      style={{ flex: 1, backgroundColor }}
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
        <TaskDetailContent
          task={task}
          blocks={blocks}
          isLoadingContent={isLoadingContent}
          isFullScreen={isFullScreen}
        />
      </ScrollView>
    </Pressable>
  );
}
