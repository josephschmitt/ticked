import { View, Text, Pressable, Linking, useColorScheme, ActivityIndicator } from "react-native";
import { Circle, CheckCircle2, Link as LinkIcon, Calendar, FolderOpen } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { Task } from "@/types/task";
import type { NotionBlock } from "@/services/notion/operations/getPageContent";
import { getContentPreview } from "@/services/notion/operations/getPageContent";
import { BlockListRenderer } from "@/components/notion/BlockRenderer";
import { BRAND_COLORS, IOS_GRAYS, NOTION_COLORS, NotionColor } from "@/constants/colors";

interface TaskDetailContentProps {
  task: Task;
  blocks: NotionBlock[] | undefined;
  isLoadingContent: boolean;
  isFullScreen: boolean;
}

/**
 * Main content area for the task detail sheet.
 * Shows title, metadata, and page content.
 */
export function TaskDetailContent({
  task,
  blocks,
  isLoadingContent,
  isFullScreen,
}: TaskDetailContentProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const isComplete = task.status.group === "complete";
  const statusColorKey = task.status.color as NotionColor;
  const statusBgColor = NOTION_COLORS[statusColorKey]
    ? (isDark ? NOTION_COLORS[statusColorKey].dark : NOTION_COLORS[statusColorKey].light)
    : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

  // Format date for display
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  };

  const displayDate = formatDate(task.doDate) || formatDate(task.dueDate);
  const checkboxColor = isComplete ? BRAND_COLORS.primary : (isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3);

  const handleOpenUrl = () => {
    if (task.url) {
      Haptics.selectionAsync();
      Linking.openURL(task.url);
    }
  };

  // Content preview for partial view
  const contentPreview = blocks ? getContentPreview(blocks, 150) : "";

  return (
    <View className="flex-1 px-4 pt-4">
      {/* Title with checkbox */}
      <View className="flex-row items-start mb-4">
        <View className="w-8 h-8 items-center justify-center mt-0.5">
          {isComplete ? (
            <CheckCircle2 size={28} color={checkboxColor} strokeWidth={2} />
          ) : (
            <Circle size={28} color={checkboxColor} strokeWidth={1.5} />
          )}
        </View>
        <Text
          className={`flex-1 ml-2 text-[28px] font-semibold leading-tight ${
            isComplete
              ? "text-label-secondary dark:text-label-dark-secondary line-through"
              : "text-label-primary dark:text-label-dark-primary"
          }`}
        >
          {task.title}
        </Text>
      </View>

      {/* Metadata row */}
      <View className="flex-row flex-wrap items-center mb-4 gap-2">
        {/* Status badge */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: statusBgColor }}
        >
          <Text className="text-[13px] font-medium text-label-primary dark:text-label-dark-primary">
            {task.status.name}
          </Text>
        </View>

        {/* Project */}
        {task.project && (
          <View className="flex-row items-center px-2 py-1">
            <FolderOpen size={14} color={isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system} strokeWidth={2} />
            <Text className="ml-1 text-[13px] text-label-secondary dark:text-label-dark-secondary">
              {task.project}
            </Text>
          </View>
        )}

        {/* Date */}
        {displayDate && (
          <View className="flex-row items-center px-2 py-1">
            <Calendar size={14} color={isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system} strokeWidth={2} />
            <Text className="ml-1 text-[13px] text-label-secondary dark:text-label-dark-secondary">
              {displayDate}
            </Text>
          </View>
        )}

        {/* URL link */}
        {task.url && (
          <Pressable
            onPress={handleOpenUrl}
            className="flex-row items-center px-2 py-1 active:opacity-70"
          >
            <LinkIcon size={14} color={BRAND_COLORS.primary} strokeWidth={2} />
            <Text className="ml-1 text-[13px]" style={{ color: BRAND_COLORS.primary }}>
              Link
            </Text>
          </Pressable>
        )}
      </View>

      {/* Content area */}
      {isFullScreen ? (
        // Full content in expanded view
        <View className="flex-1">
          {isLoadingContent ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            </View>
          ) : blocks && blocks.length > 0 ? (
            <BlockListRenderer blocks={blocks} />
          ) : (
            <Text className="text-[15px] text-label-tertiary dark:text-label-dark-tertiary italic">
              No content
            </Text>
          )}
        </View>
      ) : (
        // Preview in partial view
        <View>
          {isLoadingContent ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={BRAND_COLORS.primary} />
            </View>
          ) : contentPreview ? (
            <Text
              className="text-[15px] text-label-secondary dark:text-label-dark-secondary"
              numberOfLines={3}
            >
              {contentPreview}
            </Text>
          ) : (
            <Text className="text-[15px] text-label-tertiary dark:text-label-dark-tertiary italic">
              No content
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
