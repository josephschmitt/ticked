import { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Pressable,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useConfigStore } from "@/stores/configStore";
import { useStatuses } from "@/hooks/queries/useTasks";
import { useCreateTask, type CreateTaskParams } from "@/hooks/mutations/useCreateTask";
import { TaskDetailHeader } from "@/components/tasks/TaskDetailHeader";
import { TaskDetailContent } from "@/components/tasks/TaskDetailContent";
import { IOS_BACKGROUNDS } from "@/constants/colors";
import type { TaskStatus } from "@/types/task";

const FULL_SCREEN_THRESHOLD = 0.7;

export default function NewTaskScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { height: screenHeight } = useWindowDimensions();

  const [isFullScreen, setIsFullScreen] = useState(false);

  // Track if we should create on unmount
  const shouldCreateRef = useRef(true);

  const defaultStatusId = useConfigStore((state) => state.defaultStatusId);
  const { data: statuses } = useStatuses();
  const createTaskMutation = useCreateTask();

  // Store mutation in ref to avoid dependency issues
  const createTaskRef = useRef(createTaskMutation.mutate);
  createTaskRef.current = createTaskMutation.mutate;

  // Determine default status
  const defaultStatus = useMemo((): TaskStatus | null => {
    if (!statuses?.length) return null;
    if (defaultStatusId) {
      const preferred = statuses.find((s) => s.id === defaultStatusId);
      if (preferred) return preferred;
    }
    return statuses.find((s) => s.group === "todo") || statuses[0];
  }, [statuses, defaultStatusId]);

  const groupedBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const elevatedBg = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const viewHeight = event.nativeEvent.layout.height;
      const ratio = viewHeight / screenHeight;
      setIsFullScreen(ratio > FULL_SCREEN_THRESHOLD);
    },
    [screenHeight]
  );

  const handleCreateTask = useCallback((params: CreateTaskParams) => {
    if (shouldCreateRef.current) {
      createTaskRef.current(params);
    }
  }, []);

  const handleCancel = useCallback(() => {
    // Don't create task on cancel
    shouldCreateRef.current = false;
    router.back();
  }, []);

  return (
    <Pressable
      style={{ flex: 1, backgroundColor: groupedBg }}
      onLayout={handleLayout}
    >
      {isFullScreen && (
        <TaskDetailHeader
          title="New Task"
          onSave={handleCancel}
          saveDisabled={false}
        />
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: elevatedBg,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
          }}
        >
          <TaskDetailContent
            mode="create"
            isFullScreen={isFullScreen}
            initialStatus={defaultStatus}
            onCreateTask={handleCreateTask}
          />
        </View>
      </ScrollView>
    </Pressable>
  );
}
