import { useCallback, useState, useEffect, useRef } from "react";
import { View, useColorScheme, useWindowDimensions, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTask } from "@/hooks/queries/useTask";
import { usePageContent } from "@/hooks/queries/usePageContent";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { IOS_BACKGROUNDS, BRAND_COLORS } from "@/constants/colors";

// Threshold for considering the sheet "full screen" (percentage of screen height)
const FULL_SCREEN_THRESHOLD = 0.7;

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { height: screenHeight } = useWindowDimensions();

  // Track whether sheet is in full screen mode
  const [isFullScreen, setIsFullScreen] = useState(false);
  const lastHeightRef = useRef(0);

  // Get task from cache or fetch from server
  const { task, isLoading, isError } = useTask(id);

  // Fetch page content
  const { data: blocks, isLoading: isLoadingContent } = usePageContent(id);

  const groupedBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const elevatedBg = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;

  // Track layout to determine if we're in full screen mode
  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const viewHeight = event.nativeEvent.layout.height;
      // Only update if height changed significantly (avoid micro-updates)
      if (Math.abs(viewHeight - lastHeightRef.current) > 10) {
        lastHeightRef.current = viewHeight;
        const ratio = viewHeight / screenHeight;
        setIsFullScreen(ratio > FULL_SCREEN_THRESHOLD);
      }
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
    <ScrollView
      style={{ backgroundColor: elevatedBg }}
      contentContainerStyle={{ paddingBottom: 40 }}
      onLayout={handleLayout}
      scrollEnabled={isFullScreen}
      showsVerticalScrollIndicator={isFullScreen}
      nestedScrollEnabled={true}
      bounces={isFullScreen}
    >
      <TaskDetailContent
        mode="edit"
        task={task}
        blocks={blocks}
        isLoadingContent={isLoadingContent}
        isFullScreen={isFullScreen}
        timestamps={{
          creationDate: task.creationDate,
          lastEditedTime: task.lastEditedTime,
          completedDate: task.status.group === "complete" ? task.completedDate : undefined,
        }}
      />
    </ScrollView>
  );
}
