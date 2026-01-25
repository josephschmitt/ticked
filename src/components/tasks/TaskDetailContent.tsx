import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  useColorScheme,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { Circle, CheckCircle2, Link as LinkIcon, FolderOpen, Tag, Plus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { Task } from "@/types/task";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { MarkdownContent } from "@/components/notion/MarkdownContent";
import { RelationBadge } from "@/components/ui/RelationBadge";
import { EditableDateBadge } from "@/components/tasks/EditableDateBadge";
import { StatusPicker } from "@/components/tasks/StatusPicker";
import { SelectPicker, type SelectOption } from "@/components/tasks/SelectPicker";
import { RelationPicker } from "@/components/tasks/RelationPicker";
import { useConfigStore } from "@/stores/configStore";
import { useStatuses } from "@/hooks/queries/useTasks";
import { useDatabaseSchema } from "@/hooks/queries/useDatabaseSchema";
import { useRelationOptions } from "@/hooks/queries/useRelationOptions";
import {
  useUpdateTaskStatus,
  useUpdateTaskCheckbox,
  useUpdateTaskTitle,
  useUpdateTaskDate,
  useUpdateTaskSelect,
  useUpdateTaskRelation,
  useUpdateTaskUrl,
} from "@/hooks/mutations/useUpdateTask";
import { BRAND_COLORS, IOS_GRAYS, NOTION_COLORS, NotionColor } from "@/constants/colors";

interface TaskDetailContentProps {
  task: Task;
  blocks: NotionBlock[] | undefined;
  isLoadingContent: boolean;
  isFullScreen: boolean;
}

/**
 * Main content area for the task detail sheet.
 * Shows editable title, metadata, and page content.
 */
export function TaskDetailContent({
  task,
  blocks,
  isLoadingContent,
  isFullScreen,
}: TaskDetailContentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Store state
  const approachingDaysThreshold = useConfigStore((state) => state.approachingDaysThreshold);
  const defaultStatusId = useConfigStore((state) => state.defaultStatusId);
  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);

  // Queries
  const { data: statuses } = useStatuses();
  const { data: schema } = useDatabaseSchema(databaseId);

  // Get property info from schema
  const taskTypeProperty = schema?.properties.find((p) => p.id === fieldMapping?.taskType);
  const projectProperty = schema?.properties.find((p) => p.id === fieldMapping?.project);

  // Get relation options if needed
  const { data: taskTypeRelationOptions, isLoading: isLoadingTaskTypeOptions } = useRelationOptions(
    taskTypeProperty?.type === "relation" ? taskTypeProperty.relationDatabaseId : undefined
  );
  const { data: projectRelationOptions, isLoading: isLoadingProjectOptions } = useRelationOptions(
    projectProperty?.type === "relation" ? projectProperty.relationDatabaseId : undefined
  );

  // Mutations
  const updateStatusMutation = useUpdateTaskStatus();
  const updateCheckboxMutation = useUpdateTaskCheckbox();
  const updateTitleMutation = useUpdateTaskTitle();
  const updateDateMutation = useUpdateTaskDate();
  const updateSelectMutation = useUpdateTaskSelect();
  const updateRelationMutation = useUpdateTaskRelation();
  const updateUrlMutation = useUpdateTaskUrl();

  // Local state for editing
  const [localTitle, setLocalTitle] = useState(task.title);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showTaskTypePicker, setShowTaskTypePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [editedUrl, setEditedUrl] = useState(task.url || "");

  // Computed values
  const isComplete = task.status.group === "complete";
  const statusColorKey = task.status.color as NotionColor;
  const statusBgColor = NOTION_COLORS[statusColorKey]
    ? (isDark ? NOTION_COLORS[statusColorKey].dark : NOTION_COLORS[statusColorKey].light)
    : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

  const checkboxColor = isComplete ? BRAND_COLORS.primary : (isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3);
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const isCheckboxType = task.status.id === "checked" || task.status.id === "unchecked";
  const isToggling = updateStatusMutation.isPending || updateCheckboxMutation.isPending;

  // Handlers
  const handleCheckboxPress = useCallback(() => {
    if (isToggling) return;

    Haptics.selectionAsync();

    if (isCheckboxType) {
      const newChecked = task.status.id !== "checked";
      updateCheckboxMutation.mutate(
        { task, checked: newChecked },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    } else if (statuses) {
      if (isComplete) {
        let targetStatus = defaultStatusId
          ? statuses.find((s) => s.id === defaultStatusId)
          : undefined;
        if (!targetStatus) {
          targetStatus = statuses.find((s) => s.group === "todo");
        }
        if (targetStatus) {
          updateStatusMutation.mutate(
            { task, newStatus: targetStatus },
            {
              onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
              onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
            }
          );
        }
      } else {
        const completeStatus = statuses.find((s) => s.group === "complete");
        if (completeStatus) {
          updateStatusMutation.mutate(
            { task, newStatus: completeStatus },
            {
              onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
              onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
            }
          );
        }
      }
    }
  }, [isToggling, isCheckboxType, task, statuses, defaultStatusId, isComplete, updateCheckboxMutation, updateStatusMutation]);

  const handleTitleSubmit = useCallback(() => {
    const trimmedTitle = localTitle.trim();
    if (trimmedTitle && trimmedTitle !== task.title) {
      updateTitleMutation.mutate(
        { task, newTitle: trimmedTitle },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // Revert on error
            setLocalTitle(task.title);
          },
        }
      );
    } else if (!trimmedTitle) {
      // Revert if empty
      setLocalTitle(task.title);
    }
  }, [localTitle, task, updateTitleMutation]);

  const handleStatusPress = useCallback(() => {
    if (isCheckboxType) return; // Checkbox types use the checkbox
    Haptics.selectionAsync();
    setShowStatusPicker(true);
  }, [isCheckboxType]);

  const handleStatusSelect = useCallback((status: typeof task.status) => {
    setShowStatusPicker(false);
    if (status.id !== task.status.id) {
      updateStatusMutation.mutate(
        { task, newStatus: status },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [task, updateStatusMutation]);

  const handleTaskTypePress = useCallback(() => {
    Haptics.selectionAsync();
    setShowTaskTypePicker(true);
  }, []);

  const handleTaskTypeSelectChange = useCallback((option: SelectOption | null) => {
    setShowTaskTypePicker(false);
    const optionName = option?.name || null;
    if (optionName !== task.taskType) {
      updateSelectMutation.mutate(
        { task, field: "taskType", optionName },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [task, updateSelectMutation]);

  const handleTaskTypeRelationChange = useCallback((option: { id: string; title: string } | null) => {
    setShowTaskTypePicker(false);
    const pageIds = option ? [option.id] : [];
    const displayName = option?.title || null;
    updateRelationMutation.mutate(
      { task, field: "taskType", pageIds, displayName },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateRelationMutation]);

  const handleProjectPress = useCallback(() => {
    Haptics.selectionAsync();
    setShowProjectPicker(true);
  }, []);

  const handleProjectSelectChange = useCallback((option: SelectOption | null) => {
    setShowProjectPicker(false);
    const optionName = option?.name || null;
    if (optionName !== task.project) {
      updateSelectMutation.mutate(
        { task, field: "project", optionName },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [task, updateSelectMutation]);

  const handleProjectRelationChange = useCallback((option: { id: string; title: string } | null) => {
    setShowProjectPicker(false);
    const pageIds = option ? [option.id] : [];
    const displayName = option?.title || null;
    updateRelationMutation.mutate(
      { task, field: "project", pageIds, displayName },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateRelationMutation]);

  const handleDoDateChange = useCallback((date: string | null) => {
    updateDateMutation.mutate(
      { task, field: "doDate", date },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateDateMutation]);

  const handleDueDateChange = useCallback((date: string | null) => {
    updateDateMutation.mutate(
      { task, field: "dueDate", date },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateDateMutation]);

  const handleUrlPress = useCallback(() => {
    Haptics.selectionAsync();
    // Show options: Edit, Open, or Clear
    Alert.alert(
      "URL",
      task.url || undefined,
      [
        {
          text: "Edit",
          onPress: () => {
            setEditedUrl(task.url || "");
            setShowUrlEditor(true);
          },
        },
        ...(task.url
          ? [
              {
                text: "Open",
                onPress: () => {
                  if (task.url) Linking.openURL(task.url);
                },
              },
              {
                text: "Clear",
                style: "destructive" as const,
                onPress: () => {
                  updateUrlMutation.mutate(
                    { task, url: null },
                    {
                      onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
                      onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
                    }
                  );
                },
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" },
      ]
    );
  }, [task, updateUrlMutation]);

  const handleUrlSubmit = useCallback(() => {
    const trimmedUrl = editedUrl.trim();
    setShowUrlEditor(false);
    if (trimmedUrl !== (task.url || "")) {
      updateUrlMutation.mutate(
        { task, url: trimmedUrl || null },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [editedUrl, task, updateUrlMutation]);

  const handleContentPress = useCallback(() => {
    Haptics.selectionAsync();
    if (task.notionUrl) {
      Linking.openURL(task.notionUrl);
    }
  }, [task.notionUrl]);

  // Determine if we have date fields configured
  const hasDoDateField = !!fieldMapping?.doDate;
  const hasDueDateField = !!fieldMapping?.dueDate;
  const hasUrlField = !!fieldMapping?.url;
  const hasTaskTypeField = !!fieldMapping?.taskType;
  const hasProjectField = !!fieldMapping?.project;

  // Find current relation IDs for pickers
  // Note: We'd need to store the relation IDs on the task to properly handle this
  // For now, we'll match by name
  const currentTaskTypeRelationId = taskTypeRelationOptions?.find((o) => o.title === task.taskType)?.id || null;
  const currentProjectRelationId = projectRelationOptions?.find((o) => o.title === task.project)?.id || null;

  return (
    <View className="flex-1 px-6 pt-8">
      {/* Title with checkbox */}
      <View className="flex-row items-start mb-4">
        <Pressable
          onPress={handleCheckboxPress}
          disabled={isToggling}
          className="w-8 h-8 items-center justify-center mt-0.5"
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
          ) : isComplete ? (
            <CheckCircle2 size={28} color={checkboxColor} strokeWidth={2} />
          ) : (
            <Circle size={28} color={checkboxColor} strokeWidth={1.5} />
          )}
        </Pressable>
        <TextInput
          value={localTitle}
          onChangeText={setLocalTitle}
          onSubmitEditing={handleTitleSubmit}
          onBlur={handleTitleSubmit}
          returnKeyType="done"
          blurOnSubmit={true}
          multiline
          className={`flex-1 ml-2 text-[28px] font-semibold leading-tight ${
            isComplete
              ? "text-label-secondary dark:text-label-dark-secondary"
              : "text-label-primary dark:text-label-dark-primary"
          }`}
          style={{
            padding: 0,
            margin: 0,
            textDecorationLine: isComplete ? "line-through" : "none",
          }}
        />
      </View>

      {/* Metadata row */}
      <View className="flex-row flex-wrap items-center mb-4 gap-1.5 ml-10">
        {/* Status badge */}
        {!isCheckboxType && (
          <Pressable onPress={handleStatusPress} className="active:opacity-70">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusBgColor }}
            >
              <Text className="text-[13px] font-medium text-label-primary dark:text-label-dark-primary">
                {task.status.name}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Task Type */}
        {hasTaskTypeField && (
          <Pressable onPress={handleTaskTypePress} className="flex-row items-center px-1 py-1 active:opacity-70">
            {task.taskType ? (
              <RelationBadge
                name={task.taskType}
                icon={task.taskTypeIcon}
                fallbackIcon={Tag}
                size="medium"
              />
            ) : (
              <View className="flex-row items-center gap-1">
                <Plus size={14} color={secondaryColor} strokeWidth={2} />
                <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                  Type
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Project */}
        {hasProjectField && (
          <Pressable onPress={handleProjectPress} className="flex-row items-center px-1 py-1 active:opacity-70">
            {task.project ? (
              <RelationBadge
                name={task.project}
                icon={task.projectIcon}
                fallbackIcon={FolderOpen}
                size="medium"
              />
            ) : (
              <View className="flex-row items-center gap-1">
                <Plus size={14} color={secondaryColor} strokeWidth={2} />
                <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
                  Project
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Dates */}
        <View className={`flex-row items-center gap-2 ${isComplete ? 'opacity-60' : ''}`}>
          {hasDoDateField && (
            <View className="flex-row items-center px-1 py-1">
              <EditableDateBadge
                date={task.doDate}
                type="do"
                isComplete={isComplete}
                size="medium"
                approachingDaysThreshold={approachingDaysThreshold}
                onDateChange={handleDoDateChange}
                placeholder="+ Do date"
              />
            </View>
          )}
          {hasDueDateField && (
            <View className="flex-row items-center px-1 py-1">
              <EditableDateBadge
                date={task.dueDate}
                type="due"
                isComplete={isComplete}
                size="medium"
                approachingDaysThreshold={approachingDaysThreshold}
                onDateChange={handleDueDateChange}
                placeholder="+ Due date"
              />
            </View>
          )}
        </View>

        {/* URL */}
        {hasUrlField && (
          <Pressable
            onPress={handleUrlPress}
            className="flex-row items-center flex-1 min-w-0 px-1 py-1 active:opacity-70"
          >
            <LinkIcon
              size={14}
              color={secondaryColor}
              strokeWidth={2}
              style={{ flexShrink: 0 }}
            />
            {task.url ? (
              <Text
                className="text-[13px] text-label-secondary dark:text-label-dark-secondary ml-1 flex-shrink"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {task.url}
              </Text>
            ) : (
              <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary ml-1">
                Add URL
              </Text>
            )}
          </Pressable>
        )}
      </View>

      {/* Divider */}
      <View className="my-6 bg-separator dark:bg-separator-dark" style={{ height: StyleSheet.hairlineWidth }} />

      {/* Content area - tap to open in Notion */}
      <Pressable onPress={handleContentPress} className="flex-1 active:opacity-70">
        {isLoadingContent ? (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
          </View>
        ) : blocks && blocks.length > 0 ? (
          <>
            <MarkdownContent blocks={blocks} />
            <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary mt-4 text-center">
              Tap to edit in Notion
            </Text>
          </>
        ) : (
          <View className="py-4 items-center">
            <Text className="text-[15px] text-label-tertiary dark:text-label-dark-tertiary italic">
              No content
            </Text>
            <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary mt-2">
              Tap to add content in Notion
            </Text>
          </View>
        )}
      </Pressable>

      {/* Status Picker */}
      {statuses && (
        <StatusPicker
          visible={showStatusPicker}
          statuses={statuses}
          selectedId={task.status.id}
          onSelect={handleStatusSelect}
          onCancel={() => setShowStatusPicker(false)}
        />
      )}

      {/* Task Type Picker */}
      {taskTypeProperty?.type === "select" && taskTypeProperty.options && (
        <SelectPicker
          visible={showTaskTypePicker}
          title="Task Type"
          options={taskTypeProperty.options}
          selectedName={task.taskType || null}
          onSelect={handleTaskTypeSelectChange}
          onCancel={() => setShowTaskTypePicker(false)}
        />
      )}
      {taskTypeProperty?.type === "relation" && (
        <RelationPicker
          visible={showTaskTypePicker}
          title="Task Type"
          options={taskTypeRelationOptions || []}
          selectedId={currentTaskTypeRelationId}
          onSelect={handleTaskTypeRelationChange}
          onCancel={() => setShowTaskTypePicker(false)}
          isLoading={isLoadingTaskTypeOptions}
        />
      )}

      {/* Project Picker */}
      {projectProperty?.type === "select" && projectProperty.options && (
        <SelectPicker
          visible={showProjectPicker}
          title="Project"
          options={projectProperty.options}
          selectedName={task.project || null}
          onSelect={handleProjectSelectChange}
          onCancel={() => setShowProjectPicker(false)}
        />
      )}
      {projectProperty?.type === "relation" && (
        <RelationPicker
          visible={showProjectPicker}
          title="Project"
          options={projectRelationOptions || []}
          selectedId={currentProjectRelationId}
          onSelect={handleProjectRelationChange}
          onCancel={() => setShowProjectPicker(false)}
          isLoading={isLoadingProjectOptions}
        />
      )}

      {/* URL Editor Modal */}
      {showUrlEditor && (
        <View
          className="absolute inset-0 bg-black/50 items-center justify-center"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <View className="mx-6 bg-background-elevated dark:bg-background-dark-elevated rounded-xl p-4 w-full max-w-md">
            <Text className="text-[17px] font-semibold text-label-primary dark:text-label-dark-primary mb-4">
              Edit URL
            </Text>
            <TextInput
              value={editedUrl}
              onChangeText={setEditedUrl}
              placeholder="https://example.com"
              placeholderTextColor={secondaryColor}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={handleUrlSubmit}
              autoFocus
              className="text-[17px] text-label-primary dark:text-label-dark-primary bg-background-grouped dark:bg-background-dark-grouped p-3 rounded-lg"
            />
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => setShowUrlEditor(false)}
                className="px-4 py-2"
              >
                <Text className="text-[17px]" style={{ color: BRAND_COLORS.primary }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUrlSubmit}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Text className="text-[17px] font-semibold text-white">
                  Save
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
