import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Circle, CheckCircle2, Link as LinkIcon, FolderOpen, Tag, Plus, ExternalLink } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { Task, TaskStatus } from "@/types/task";
import type { DatabaseIcon } from "@/types/database";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { NotionContent } from "@/components/notion/NotionContent";
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
import type { CreateTaskParams, TaskTypeValue, ProjectValue } from "@/hooks/mutations/useCreateTask";
import { BRAND_COLORS, IOS_GRAYS, NOTION_COLORS, NotionColor } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

/** Strip protocol (https://, http://) from URL for display */
const formatDisplayUrl = (url: string) => url.replace(/^https?:\/\//, "");

interface TaskDetailContentProps {
  // Edit mode: provide task and blocks
  task?: Task;
  blocks?: NotionBlock[];
  isLoadingContent?: boolean;
  isFullScreen: boolean;
  // Create mode: provide these instead
  mode?: "edit" | "create";
  initialStatus?: TaskStatus | null;
  onCreateTask?: (params: CreateTaskParams) => void;
}

/**
 * Main content area for the task detail sheet.
 * Shows editable title, metadata, and page content.
 * Supports both "edit" mode (with existing task) and "create" mode (for new tasks).
 */
export function TaskDetailContent({
  task,
  blocks,
  isLoadingContent = false,
  isFullScreen,
  mode: modeProp,
  initialStatus,
  onCreateTask,
}: TaskDetailContentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fontSize, iconSize } = useMacSizing();

  // Determine mode from props
  const mode = modeProp ?? (task ? "edit" : "create");
  const isCreateMode = mode === "create";

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

  // Mutations (only used in edit mode)
  const updateStatusMutation = useUpdateTaskStatus();
  const updateCheckboxMutation = useUpdateTaskCheckbox();
  const updateTitleMutation = useUpdateTaskTitle();
  const updateDateMutation = useUpdateTaskDate();
  const updateSelectMutation = useUpdateTaskSelect();
  const updateRelationMutation = useUpdateTaskRelation();
  const updateUrlMutation = useUpdateTaskUrl();

  // Ref for title input
  const titleInputRef = useRef<TextInput>(null);

  // Local state for all fields (used in create mode, synced from task in edit mode)
  const [localTitle, setLocalTitle] = useState(task?.title ?? "");
  const [localStatus, setLocalStatus] = useState<TaskStatus | null>(task?.status ?? initialStatus ?? null);
  const [localDoDate, setLocalDoDate] = useState<string | undefined>(task?.doDate);
  const [localDueDate, setLocalDueDate] = useState<string | undefined>(task?.dueDate);
  const [localTaskType, setLocalTaskType] = useState<TaskTypeValue | null>(null);
  const [localTaskTypeIcon, setLocalTaskTypeIcon] = useState<DatabaseIcon | null>(task?.taskTypeIcon ?? null);
  const [localProject, setLocalProject] = useState<ProjectValue | null>(null);
  const [localProjectIcon, setLocalProjectIcon] = useState<DatabaseIcon | null>(task?.projectIcon ?? null);
  const [localUrl, setLocalUrl] = useState<string | undefined>(task?.url);

  // Picker visibility state
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showTaskTypePicker, setShowTaskTypePicker] = useState(false);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [editedUrl, setEditedUrl] = useState(task?.url || "");

  // Refs for unmount access in create mode
  const titleRef = useRef(localTitle);
  const statusRef = useRef(localStatus);
  const doDateRef = useRef(localDoDate);
  const dueDateRef = useRef(localDueDate);
  const taskTypeRef = useRef(localTaskType);
  const taskTypeIconRef = useRef(localTaskTypeIcon);
  const projectRef = useRef(localProject);
  const projectIconRef = useRef(localProjectIcon);
  const urlRef = useRef(localUrl);
  const onCreateTaskRef = useRef(onCreateTask);

  // Keep refs in sync with state
  useEffect(() => { titleRef.current = localTitle; }, [localTitle]);
  useEffect(() => { statusRef.current = localStatus; }, [localStatus]);
  useEffect(() => { doDateRef.current = localDoDate; }, [localDoDate]);
  useEffect(() => { dueDateRef.current = localDueDate; }, [localDueDate]);
  useEffect(() => { taskTypeRef.current = localTaskType; }, [localTaskType]);
  useEffect(() => { taskTypeIconRef.current = localTaskTypeIcon; }, [localTaskTypeIcon]);
  useEffect(() => { projectRef.current = localProject; }, [localProject]);
  useEffect(() => { projectIconRef.current = localProjectIcon; }, [localProjectIcon]);
  useEffect(() => { urlRef.current = localUrl; }, [localUrl]);
  useEffect(() => { onCreateTaskRef.current = onCreateTask; }, [onCreateTask]);

  // Create task on unmount in create mode
  useEffect(() => {
    if (!isCreateMode) return;

    return () => {
      const finalTitle = titleRef.current.trim();
      const finalStatus = statusRef.current;

      if (finalTitle && finalStatus && onCreateTaskRef.current) {
        onCreateTaskRef.current({
          title: finalTitle,
          status: finalStatus,
          doDate: doDateRef.current,
          dueDate: dueDateRef.current,
          taskType: taskTypeRef.current ?? undefined,
          taskTypeIcon: taskTypeIconRef.current,
          project: projectRef.current ?? undefined,
          projectIcon: projectIconRef.current,
          url: urlRef.current,
        });
      }
    };
  }, [isCreateMode]);

  // Sync local state with task prop in edit mode
  useEffect(() => {
    if (!isCreateMode && task) {
      setLocalTitle(task.title);
      setLocalStatus(task.status);
      setLocalDoDate(task.doDate);
      setLocalDueDate(task.dueDate);
      setLocalTaskTypeIcon(task.taskTypeIcon ?? null);
      setLocalProjectIcon(task.projectIcon ?? null);
      setLocalUrl(task.url);
      setEditedUrl(task.url || "");
    }
  }, [isCreateMode, task]);

  // Auto-focus title if empty (new task or create mode)
  useEffect(() => {
    if (isCreateMode || !task?.title) {
      const timeout = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [isCreateMode, task?.title]);

  // Display values (use local state in create mode, task props in edit mode)
  const displayTitle = isCreateMode ? localTitle : (task?.title ?? "");
  const displayStatus = isCreateMode ? localStatus : task?.status;
  const displayDoDate = isCreateMode ? localDoDate : task?.doDate;
  const displayDueDate = isCreateMode ? localDueDate : task?.dueDate;
  const displayTaskType = isCreateMode
    ? (localTaskType?.type === "select" ? localTaskType.name : localTaskType?.displayName)
    : task?.taskType;
  const displayTaskTypeIcon = isCreateMode ? localTaskTypeIcon : task?.taskTypeIcon;
  const displayProject = isCreateMode
    ? (localProject?.type === "select" ? localProject.name : localProject?.displayName)
    : task?.project;
  const displayProjectIcon = isCreateMode ? localProjectIcon : task?.projectIcon;
  const displayUrl = isCreateMode ? localUrl : task?.url;

  // Computed values
  const isComplete = displayStatus?.group === "complete";
  const statusColorKey = displayStatus?.color as NotionColor;
  const statusBgColor = statusColorKey && NOTION_COLORS[statusColorKey]
    ? (isDark ? NOTION_COLORS[statusColorKey].dark : NOTION_COLORS[statusColorKey].light)
    : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

  const checkboxColor = isComplete ? BRAND_COLORS.primary : (isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3);
  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const isCheckboxType = displayStatus?.id === "checked" || displayStatus?.id === "unchecked";
  const isToggling = updateStatusMutation.isPending || updateCheckboxMutation.isPending;

  // Handlers
  const handleCheckboxPress = useCallback(() => {
    if (isToggling) return;

    Haptics.selectionAsync();

    if (isCreateMode) {
      // In create mode, toggle between todo and complete status
      if (statuses) {
        if (isComplete) {
          const todoStatus = statuses.find((s) => s.group === "todo") || statuses[0];
          setLocalStatus(todoStatus);
        } else {
          const completeStatus = statuses.find((s) => s.group === "complete");
          if (completeStatus) setLocalStatus(completeStatus);
        }
      }
      return;
    }

    // Edit mode - update via mutations
    if (!task) return;

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
  }, [isToggling, isCheckboxType, task, statuses, defaultStatusId, isComplete, updateCheckboxMutation, updateStatusMutation, isCreateMode]);

  const handleTitleSubmit = useCallback(() => {
    const trimmedTitle = localTitle.trim();

    if (isCreateMode) {
      // In create mode, just keep local state (will be used on unmount)
      if (!trimmedTitle) {
        setLocalTitle("");
      }
      return;
    }

    // Edit mode
    if (!task) return;

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
  }, [localTitle, task, updateTitleMutation, isCreateMode]);

  const handleStatusPress = useCallback(() => {
    if (isCheckboxType) return; // Checkbox types use the checkbox
    Haptics.selectionAsync();
    setShowStatusPicker(true);
  }, [isCheckboxType]);

  const handleStatusSelect = useCallback((status: TaskStatus) => {
    setShowStatusPicker(false);

    if (isCreateMode) {
      setLocalStatus(status);
      return;
    }

    // Edit mode
    if (!task) return;

    if (status.id !== task.status.id) {
      updateStatusMutation.mutate(
        { task, newStatus: status },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [task, updateStatusMutation, isCreateMode]);

  const handleTaskTypePress = useCallback(() => {
    Haptics.selectionAsync();
    setShowTaskTypePicker(true);
  }, []);

  const handleTaskTypeSelectChange = useCallback((option: SelectOption | null) => {
    setShowTaskTypePicker(false);

    if (isCreateMode) {
      if (option) {
        setLocalTaskType({ type: "select", name: option.name });
        setLocalTaskTypeIcon(null); // Select options don't have icons
      } else {
        setLocalTaskType(null);
        setLocalTaskTypeIcon(null);
      }
      return;
    }

    // Edit mode
    if (!task) return;

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
  }, [task, updateSelectMutation, isCreateMode]);

  const handleTaskTypeRelationChange = useCallback((option: { id: string; title: string; icon?: DatabaseIcon | null } | null) => {
    setShowTaskTypePicker(false);

    if (isCreateMode) {
      if (option) {
        setLocalTaskType({ type: "relation", pageId: option.id, displayName: option.title });
        setLocalTaskTypeIcon(option.icon ?? null);
      } else {
        setLocalTaskType(null);
        setLocalTaskTypeIcon(null);
      }
      return;
    }

    // Edit mode
    if (!task) return;

    const pageIds = option ? [option.id] : [];
    const displayName = option?.title || null;
    updateRelationMutation.mutate(
      { task, field: "taskType", pageIds, displayName },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateRelationMutation, isCreateMode]);

  const handleProjectPress = useCallback(() => {
    Haptics.selectionAsync();
    setShowProjectPicker(true);
  }, []);

  const handleProjectSelectChange = useCallback((option: SelectOption | null) => {
    setShowProjectPicker(false);

    if (isCreateMode) {
      if (option) {
        setLocalProject({ type: "select", name: option.name });
        setLocalProjectIcon(null);
      } else {
        setLocalProject(null);
        setLocalProjectIcon(null);
      }
      return;
    }

    // Edit mode
    if (!task) return;

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
  }, [task, updateSelectMutation, isCreateMode]);

  const handleProjectRelationChange = useCallback((option: { id: string; title: string; icon?: DatabaseIcon | null } | null) => {
    setShowProjectPicker(false);

    if (isCreateMode) {
      if (option) {
        setLocalProject({ type: "relation", pageId: option.id, displayName: option.title });
        setLocalProjectIcon(option.icon ?? null);
      } else {
        setLocalProject(null);
        setLocalProjectIcon(null);
      }
      return;
    }

    // Edit mode
    if (!task) return;

    const pageIds = option ? [option.id] : [];
    const displayName = option?.title || null;
    updateRelationMutation.mutate(
      { task, field: "project", pageIds, displayName },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateRelationMutation, isCreateMode]);

  const handleDoDateChange = useCallback((date: string | null) => {
    if (isCreateMode) {
      setLocalDoDate(date ?? undefined);
      return;
    }

    // Edit mode
    if (!task) return;

    updateDateMutation.mutate(
      { task, field: "doDate", date },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateDateMutation, isCreateMode]);

  const handleDueDateChange = useCallback((date: string | null) => {
    if (isCreateMode) {
      setLocalDueDate(date ?? undefined);
      return;
    }

    // Edit mode
    if (!task) return;

    updateDateMutation.mutate(
      { task, field: "dueDate", date },
      {
        onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
        onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      }
    );
  }, [task, updateDateMutation, isCreateMode]);

  const handleUrlPress = useCallback(() => {
    Haptics.selectionAsync();

    if (isCreateMode) {
      // In create mode, just open the editor
      setEditedUrl(localUrl || "");
      setShowUrlEditor(true);
      return;
    }

    // Edit mode - show options: Edit, Open, or Clear
    if (!task) return;

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
  }, [task, updateUrlMutation, isCreateMode, localUrl]);

  const handleUrlSubmit = useCallback(() => {
    const trimmedUrl = editedUrl.trim();
    setShowUrlEditor(false);

    if (isCreateMode) {
      setLocalUrl(trimmedUrl || undefined);
      return;
    }

    // Edit mode
    if (!task) return;

    if (trimmedUrl !== (task.url || "")) {
      updateUrlMutation.mutate(
        { task, url: trimmedUrl || null },
        {
          onSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
          onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
        }
      );
    }
  }, [editedUrl, task, updateUrlMutation, isCreateMode]);

  const handleContentPress = useCallback(() => {
    Haptics.selectionAsync();
    if (task?.notionUrl) {
      Linking.openURL(task.notionUrl);
    }
  }, [task?.notionUrl]);

  // Determine if we have date fields configured
  const hasDoDateField = !!fieldMapping?.doDate;
  const hasDueDateField = !!fieldMapping?.dueDate;
  const hasUrlField = !!fieldMapping?.url;
  const hasTaskTypeField = !!fieldMapping?.taskType;
  const hasProjectField = !!fieldMapping?.project;

  // Find current relation IDs for pickers
  // In create mode with relation, use the localTaskType/localProject pageId directly
  // In edit mode, match by name
  const currentTaskTypeRelationId = isCreateMode
    ? (localTaskType?.type === "relation" ? localTaskType.pageId : null)
    : (taskTypeRelationOptions?.find((o) => o.title === task?.taskType)?.id || null);
  const currentProjectRelationId = isCreateMode
    ? (localProject?.type === "relation" ? localProject.pageId : null)
    : (projectRelationOptions?.find((o) => o.title === task?.project)?.id || null);

  return (
    <View className="px-6 pt-8">
      {/* Title with checkbox and edit button */}
      <View className="flex-row items-start mb-4">
        <Pressable
          onPress={handleCheckboxPress}
          disabled={isToggling}
          className="w-8 h-8 items-center justify-center mt-0.5"
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
          ) : isComplete ? (
            <CheckCircle2 size={fontSize.largeTitle} color={checkboxColor} strokeWidth={2} />
          ) : (
            <Circle size={fontSize.largeTitle} color={checkboxColor} strokeWidth={1.5} />
          )}
        </Pressable>
        <TextInput
          ref={titleInputRef}
          value={localTitle}
          onChangeText={setLocalTitle}
          onSubmitEditing={handleTitleSubmit}
          onBlur={handleTitleSubmit}
          placeholder="Task name"
          placeholderTextColor={secondaryColor}
          returnKeyType="done"
          blurOnSubmit={true}
          multiline
          scrollEnabled={false}
          className={`flex-1 ml-2 font-semibold leading-tight ${
            isComplete
              ? "text-label-secondary dark:text-label-dark-secondary"
              : "text-label-primary dark:text-label-dark-primary"
          }`}
          style={{
            padding: 0,
            margin: 0,
            fontSize: fontSize.largeTitle,
            textDecorationLine: isComplete ? "line-through" : "none",
          }}
        />
        {/* Edit in Notion button */}
        {task?.notionUrl && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL(task.notionUrl);
            }}
            className="ml-2 p-2 active:opacity-70"
          >
            <ExternalLink size={20} color={secondaryColor} strokeWidth={2} />
          </Pressable>
        )}
      </View>

      {/* Metadata row - Status, Task Type, Project */}
      <View className="flex-row flex-wrap items-center mb-2 gap-1.5 ml-10">
        {/* Status badge */}
        {!isCheckboxType && displayStatus && (
          <Pressable onPress={handleStatusPress} className="active:opacity-70">
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: statusBgColor }}
            >
              <Text
                className="font-medium text-label-primary dark:text-label-dark-primary"
                style={{ fontSize: fontSize.caption }}
              >
                {displayStatus.name}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Task Type */}
        {hasTaskTypeField && (
          <Pressable onPress={handleTaskTypePress} className="flex-row items-center px-1 py-1 active:opacity-70">
            {displayTaskType ? (
              <RelationBadge
                name={displayTaskType}
                icon={displayTaskTypeIcon}
                fallbackIcon={Tag}
                size="medium"
              />
            ) : (
              <View className="flex-row items-center gap-1">
                <Plus size={iconSize.small} color={secondaryColor} strokeWidth={2} />
                <Text
                  className="text-label-tertiary dark:text-label-dark-tertiary"
                  style={{ fontSize: fontSize.caption }}
                >
                  Type
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {/* Project */}
        {hasProjectField && (
          <Pressable onPress={handleProjectPress} className="flex-row items-center px-1 py-1 active:opacity-70">
            {displayProject ? (
              <RelationBadge
                name={displayProject}
                icon={displayProjectIcon}
                fallbackIcon={FolderOpen}
                size="medium"
              />
            ) : (
              <View className="flex-row items-center gap-1">
                <Plus size={iconSize.small} color={secondaryColor} strokeWidth={2} />
                <Text
                  className="text-label-tertiary dark:text-label-dark-tertiary"
                  style={{ fontSize: fontSize.caption }}
                >
                  Project
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Secondary row - Dates and URL */}
      <View className="flex-row flex-wrap items-center mb-4 gap-1.5 ml-10">
        {/* Dates */}
        {hasDoDateField && (
          <View className={`flex-row items-center px-1 py-1 ${isComplete ? 'opacity-60' : ''}`}>
            <EditableDateBadge
              date={displayDoDate}
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
          <View className={`flex-row items-center px-1 py-1 ${isComplete ? 'opacity-60' : ''}`}>
            <EditableDateBadge
              date={displayDueDate}
              type="due"
              isComplete={isComplete}
              size="medium"
              approachingDaysThreshold={approachingDaysThreshold}
              onDateChange={handleDueDateChange}
              placeholder="+ Due date"
            />
          </View>
        )}

        {/* URL */}
        {hasUrlField && (
          <Pressable
            onPress={handleUrlPress}
            className="flex-row items-center flex-1 min-w-0 px-1 py-1 active:opacity-70"
          >
            <LinkIcon
              size={iconSize.small}
              color={secondaryColor}
              strokeWidth={2}
              style={{ flexShrink: 0 }}
            />
            {displayUrl ? (
              <Text
                className="text-label-secondary dark:text-label-dark-secondary ml-1 flex-shrink"
                style={{ fontSize: fontSize.caption }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {formatDisplayUrl(displayUrl)}
              </Text>
            ) : (
              <Text
                className="text-label-tertiary dark:text-label-dark-tertiary ml-1"
                style={{ fontSize: fontSize.caption }}
              >
                Add URL
              </Text>
            )}
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

      {/* Content area - tap to open in Notion (only in edit mode) */}
      {isCreateMode ? (
        <View className="pb-8 items-center">
          <Text
            className="text-label-tertiary dark:text-label-dark-tertiary italic"
            style={{ fontSize: fontSize.secondary }}
          >
            No content
          </Text>
          <Text
            className="text-label-tertiary dark:text-label-dark-tertiary mt-2"
            style={{ fontSize: fontSize.caption }}
          >
            Add content after creating the task
          </Text>
        </View>
      ) : (
        <View className="pb-8">
          {isLoadingContent ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            </View>
          ) : blocks && blocks.length > 0 ? (
            <NotionContent blocks={blocks} />
          ) : (
            <View className="py-4 items-center">
              <Text
                className="text-label-tertiary dark:text-label-dark-tertiary italic"
                style={{ fontSize: fontSize.secondary }}
              >
                No content
              </Text>
            </View>
          )}

          {/* Edit in Notion button */}
          {task?.notionUrl && (
            <View className="items-center mt-6">
              <Pressable
                onPress={handleContentPress}
                className="px-4 py-2 rounded active:opacity-70"
                style={{
                  borderWidth: 1,
                  borderColor: isDark ? "rgba(235,235,245,0.2)" : "rgba(60,60,67,0.2)",
                }}
              >
                <Text
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: isDark ? "rgba(235,235,245,0.4)" : "rgba(60,60,67,0.4)" }}
                >
                  EDIT IN NOTION
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Status Picker */}
      {statuses && (
        <StatusPicker
          visible={showStatusPicker}
          statuses={statuses}
          selectedId={displayStatus?.id || null}
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
          selectedName={displayTaskType || null}
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
          selectedName={displayProject || null}
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
            <Text
              className="font-semibold text-label-primary dark:text-label-dark-primary mb-4"
              style={{ fontSize: fontSize.body }}
            >
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
              className="text-label-primary dark:text-label-dark-primary bg-background-grouped dark:bg-background-dark-grouped p-3 rounded-lg"
              style={{ fontSize: fontSize.body }}
            />
            <View className="flex-row justify-end gap-3 mt-4">
              <Pressable
                onPress={() => setShowUrlEditor(false)}
                className="px-4 py-2"
              >
                <Text style={{ fontSize: fontSize.body, color: BRAND_COLORS.primary }}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUrlSubmit}
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: BRAND_COLORS.primary }}
              >
                <Text className="font-semibold text-white" style={{ fontSize: fontSize.body }}>
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
