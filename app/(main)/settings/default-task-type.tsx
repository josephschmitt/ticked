import { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Check, Tag } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useConfigStore } from "@/stores/configStore";
import { useDatabaseSchema } from "@/hooks/queries/useDatabaseSchema";
import { useRelationOptions } from "@/hooks/queries/useRelationOptions";
import { BRAND_COLORS, IOS_GRAYS, NOTION_COLORS, NotionColor } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";
import type { DatabaseIcon } from "@/types/database";

interface TaskTypeOption {
  id: string | null;
  name: string;
  type: "none" | "select" | "relation";
  color?: string;
  icon?: DatabaseIcon | null;
}

interface TaskTypeRowProps {
  option: TaskTypeOption;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  isLast?: boolean;
}

function TaskTypeRow({
  option,
  isSelected,
  onSelect,
  isLast = false,
}: TaskTypeRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fontSize, spacing, minHeight, iconSize } = useMacSizing();

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    onSelect(option.id);
  }, [option.id, onSelect]);

  const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const renderIcon = () => {
    if (option.type === "none") {
      return null;
    }

    if (option.type === "select" && option.color) {
      const colorKey = option.color as NotionColor;
      const bgColor = NOTION_COLORS[colorKey]
        ? (isDark ? NOTION_COLORS[colorKey].dark : NOTION_COLORS[colorKey].light)
        : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

      return (
        <View
          className="px-2.5 py-1 rounded-full mr-3"
          style={{ backgroundColor: bgColor }}
        >
          <Text
            className="font-medium text-label-primary dark:text-label-dark-primary"
            style={{ fontSize: fontSize.caption }}
          >
            {option.name}
          </Text>
        </View>
      );
    }

    if (option.type === "relation") {
      const icon = option.icon;
      const badgeIconSize = iconSize.medium;

      if (!icon) {
        return (
          <View className="mr-3">
            <Tag size={badgeIconSize} color={iconColor} strokeWidth={2} />
          </View>
        );
      }

      if (icon.type === "emoji" && icon.emoji) {
        return (
          <Text style={{ fontSize: fontSize.body, marginRight: 12 }}>
            {icon.emoji}
          </Text>
        );
      }

      if (
        (icon.type === "external" || icon.type === "file") &&
        (icon.external?.url || icon.file?.url)
      ) {
        const imageUrl = icon.external?.url || icon.file?.url;
        const isSvg = imageUrl?.toLowerCase().endsWith(".svg");

        return (
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: badgeIconSize,
              height: badgeIconSize,
              borderRadius: 2,
              marginRight: 12,
              opacity: isSvg ? 1 : 0.75,
            }}
            contentFit="contain"
            tintColor={isSvg ? iconColor : undefined}
          />
        );
      }

      return (
        <View className="mr-3">
          <Tag size={badgeIconSize} color={iconColor} strokeWidth={2} />
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="flex-row items-center active:opacity-70"
        style={{
          paddingVertical: spacing.rowPaddingVertical,
          paddingHorizontal: spacing.rowPaddingHorizontal,
          minHeight: minHeight.row,
        }}
      >
        {renderIcon()}
        {/* For select types, don't show duplicate name since it's in the badge */}
        {option.type !== "select" && (
          <Text
            className={`flex-1 ${option.type === "none" ? "text-label-secondary dark:text-label-dark-secondary" : "text-label-primary dark:text-label-dark-primary"}`}
            style={{ fontSize: fontSize.body }}
          >
            {option.name}
          </Text>
        )}
        {option.type === "select" && <View className="flex-1" />}
        {isSelected && (
          <Check size={iconSize.medium} color={BRAND_COLORS.primary} strokeWidth={3} />
        )}
      </Pressable>
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

export default function DefaultTaskTypeScreen() {
  const router = useRouter();

  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const fieldMapping = useConfigStore((state) => state.fieldMapping);
  const defaultTaskTypeId = useConfigStore((state) => state.defaultTaskTypeId);
  const setDefaultTaskTypeId = useConfigStore((state) => state.setDefaultTaskTypeId);

  const { data: schema, isLoading: isLoadingSchema } = useDatabaseSchema(databaseId);
  const taskTypeProperty = schema?.properties.find((p) => p.id === fieldMapping?.taskType);

  const { data: taskTypeRelationOptions, isLoading: isLoadingRelations } = useRelationOptions(
    taskTypeProperty?.type === "relation" ? taskTypeProperty.relationDatabaseId : undefined
  );

  const isLoading = isLoadingSchema || isLoadingRelations;

  // Build options list
  const options = useMemo((): TaskTypeOption[] => {
    const result: TaskTypeOption[] = [
      { id: null, name: "None", type: "none" },
    ];

    if (taskTypeProperty?.type === "select" && taskTypeProperty.options) {
      const selectOptions = [...taskTypeProperty.options]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((o) => ({
          id: o.id,
          name: o.name,
          type: "select" as const,
          color: o.color,
        }));
      result.push(...selectOptions);
    } else if (taskTypeProperty?.type === "relation" && taskTypeRelationOptions) {
      const relationOptions = [...taskTypeRelationOptions]
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((o) => ({
          id: o.id,
          name: o.title,
          type: "relation" as const,
          icon: o.icon,
        }));
      result.push(...relationOptions);
    }

    return result;
  }, [taskTypeProperty, taskTypeRelationOptions]);

  const handleSelect = useCallback(
    async (id: string | null) => {
      await setDefaultTaskTypeId(id);
      router.back();
    },
    [setDefaultTaskTypeId, router]
  );

  if (isLoading) {
    return (
      <SafeAreaView
        className="flex-1 bg-background-grouped dark:bg-background-dark-grouped"
        edges={["bottom"]}
      >
        <View className="flex-1 items-center justify-center">
          <Text className="text-label-secondary dark:text-label-dark-secondary">
            Loading task types...
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
          footer="The selected task type will be pre-filled when creating new tasks."
        >
          {options.map((option, index) => (
            <TaskTypeRow
              key={option.id ?? "none"}
              option={option}
              isSelected={defaultTaskTypeId === option.id}
              onSelect={handleSelect}
              isLast={index === options.length - 1}
            />
          ))}
        </SettingsSection>
      </ScrollView>
    </SafeAreaView>
  );
}
