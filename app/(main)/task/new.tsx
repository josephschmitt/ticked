import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Circle, Plus, Link as LinkIcon } from "lucide-react-native";
import { useConfigStore } from "@/stores/configStore";
import { useStatuses } from "@/hooks/queries/useTasks";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { TaskDetailHeader } from "@/components/tasks/TaskDetailHeader";
import { StatusPicker } from "@/components/tasks/StatusPicker";
import { IOS_BACKGROUNDS, IOS_GRAYS, NOTION_COLORS, NotionColor } from "@/constants/colors";
import type { TaskStatus } from "@/types/task";

const FULL_SCREEN_THRESHOLD = 0.7;

export default function NewTaskScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { height: screenHeight } = useWindowDimensions();
  const titleInputRef = useRef<TextInput>(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Track if we should create on unmount
  const shouldCreateRef = useRef(true);
  const titleRef = useRef("");
  const statusRef = useRef<TaskStatus | null>(null);

  const defaultStatusId = useConfigStore((state) => state.defaultStatusId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const { data: statuses } = useStatuses();
  const createTaskMutation = useCreateTask();

  // Store mutation in ref to avoid dependency issues
  const createTaskRef = useRef(createTaskMutation.mutate);
  createTaskRef.current = createTaskMutation.mutate;

  // Keep refs in sync with state
  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    statusRef.current = selectedStatus;
  }, [selectedStatus]);

  // Determine default status
  const defaultStatus = useMemo((): TaskStatus | null => {
    if (!statuses?.length) return null;
    if (defaultStatusId) {
      const preferred = statuses.find((s) => s.id === defaultStatusId);
      if (preferred) return preferred;
    }
    return statuses.find((s) => s.group === "todo") || statuses[0];
  }, [statuses, defaultStatusId]);

  // Set initial status
  useEffect(() => {
    if (defaultStatus && !selectedStatus) {
      setSelectedStatus(defaultStatus);
    }
  }, [defaultStatus, selectedStatus]);

  // Auto-focus title
  useEffect(() => {
    const timeout = setTimeout(() => {
      titleInputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timeout);
  }, []);

  // Create task on unmount if title is non-empty
  useEffect(() => {
    return () => {
      const finalTitle = titleRef.current.trim();
      const finalStatus = statusRef.current;

      if (shouldCreateRef.current && finalTitle && finalStatus) {
        createTaskRef.current({
          title: finalTitle,
          status: finalStatus,
        });
      }
    };
  }, []);

  const groupedBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const elevatedBg = isDark ? IOS_BACKGROUNDS.elevated.dark : IOS_BACKGROUNDS.elevated.light;
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const statusColorKey = selectedStatus?.color as NotionColor;
  const statusBgColor = statusColorKey && NOTION_COLORS[statusColorKey]
    ? (isDark ? NOTION_COLORS[statusColorKey].dark : NOTION_COLORS[statusColorKey].light)
    : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

  const handleLayout = useCallback(
    (event: { nativeEvent: { layout: { height: number } } }) => {
      const viewHeight = event.nativeEvent.layout.height;
      const ratio = viewHeight / screenHeight;
      setIsFullScreen(ratio > FULL_SCREEN_THRESHOLD);
    },
    [screenHeight]
  );

  const handleStatusPress = useCallback(() => {
    Haptics.selectionAsync();
    setShowStatusPicker(true);
  }, []);

  const handleStatusSelect = useCallback((status: TaskStatus) => {
    setShowStatusPicker(false);
    setSelectedStatus(status);
  }, []);

  const handleCancel = useCallback(() => {
    // Don't create task on cancel
    shouldCreateRef.current = false;
    router.back();
  }, []);

  const hasTaskTypeField = !!fieldMapping?.taskType;
  const hasProjectField = !!fieldMapping?.project;
  const hasDoDateField = !!fieldMapping?.doDate;
  const hasDueDateField = !!fieldMapping?.dueDate;
  const hasUrlField = !!fieldMapping?.url;

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
          <View className="px-6 pt-8">
            {/* Title with checkbox placeholder */}
            <View className="flex-row items-start mb-4">
              <View className="w-8 h-8 items-center justify-center mt-0.5">
                <Circle size={28} color={isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3} strokeWidth={1.5} />
              </View>
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder="Task name"
                placeholderTextColor={secondaryColor}
                returnKeyType="done"
                blurOnSubmit={true}
                multiline
                className="flex-1 ml-2 text-[28px] font-semibold leading-tight text-label-primary dark:text-label-dark-primary"
                style={{
                  padding: 0,
                  margin: 0,
                }}
              />
            </View>

            {/* Metadata row */}
            <View className="flex-row flex-wrap items-center mb-2 gap-1.5 ml-10">
              {selectedStatus && (
                <Pressable onPress={handleStatusPress} className="active:opacity-70">
                  <View
                    className="px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: statusBgColor }}
                  >
                    <Text className="text-[13px] font-medium text-label-primary dark:text-label-dark-primary">
                      {selectedStatus.name}
                    </Text>
                  </View>
                </Pressable>
              )}

              {hasTaskTypeField && (
                <Pressable className="flex-row items-center px-1 py-1 opacity-50">
                  <View className="flex-row items-center gap-1">
                    <Plus size={14} color={secondaryColor} strokeWidth={2} />
                    <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                      Type
                    </Text>
                  </View>
                </Pressable>
              )}

              {hasProjectField && (
                <Pressable className="flex-row items-center px-1 py-1 opacity-50">
                  <View className="flex-row items-center gap-1">
                    <Plus size={14} color={secondaryColor} strokeWidth={2} />
                    <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                      Project
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Secondary row */}
            <View className="flex-row flex-wrap items-center mb-4 gap-1.5 ml-10">
              {hasDoDateField && (
                <Pressable className="flex-row items-center px-1 py-1 opacity-50">
                  <View className="flex-row items-center gap-1">
                    <Plus size={14} color={secondaryColor} strokeWidth={2} />
                    <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                      Do date
                    </Text>
                  </View>
                </Pressable>
              )}
              {hasDueDateField && (
                <Pressable className="flex-row items-center px-1 py-1 opacity-50">
                  <View className="flex-row items-center gap-1">
                    <Plus size={14} color={secondaryColor} strokeWidth={2} />
                    <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                      Due date
                    </Text>
                  </View>
                </Pressable>
              )}
              {hasUrlField && (
                <Pressable className="flex-row items-center px-1 py-1 opacity-50">
                  <LinkIcon size={14} color={secondaryColor} strokeWidth={2} />
                  <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary ml-1">
                    Add URL
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Divider */}
            <View
              className="mt-4 mb-6"
              style={{
                height: 1,
                backgroundColor: isDark ? "rgba(84,84,88,0.25)" : "rgba(60,60,67,0.12)",
              }}
            />

            {/* Content placeholder */}
            <View className="pb-8 items-center">
              <Text className="text-[15px] text-label-tertiary dark:text-label-dark-tertiary italic">
                No content
              </Text>
              <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary mt-2">
                Add content after creating the task
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {statuses && (
        <StatusPicker
          visible={showStatusPicker}
          statuses={statuses}
          selectedId={selectedStatus?.id || null}
          onSelect={handleStatusSelect}
          onCancel={() => setShowStatusPicker(false)}
        />
      )}
    </Pressable>
  );
}
