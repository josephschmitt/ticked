import { View, Text, useColorScheme } from "react-native";
import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import type { DatabaseIcon } from "@/types/database";
import { IOS_GRAYS } from "@/constants/colors";

interface RelationBadgeProps {
  name?: string;
  icon?: DatabaseIcon | null;
  fallbackIcon: LucideIcon;
  size?: "small" | "medium" | "large";
}

/**
 * Displays a relation or select field with an icon.
 * - Renders Notion page emoji/image icons when available
 * - Falls back to the provided lucide icon for selects or pages without icons
 * - Two sizes: "small" for TaskRow, "medium" for TaskDetailContent
 */
export function RelationBadge({
  name,
  icon,
  fallbackIcon: FallbackIcon,
  size = "small",
}: RelationBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const iconSize = size === "small" ? 14 : size === "medium" ? 16 : 22;
  const emojiSize = size === "small" ? "text-[12px]" : size === "medium" ? "text-[14px]" : "text-[20px]";
  const textSize = size === "small" ? "text-[15px]" : "text-[13px]";
  const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const renderIcon = () => {
    if (!icon) {
      return <FallbackIcon size={iconSize} color={iconColor} strokeWidth={2} />;
    }

    if (icon.type === "emoji" && icon.emoji) {
      return <Text className={emojiSize}>{icon.emoji}</Text>;
    }

    if (
      (icon.type === "external" || icon.type === "file") &&
      (icon.external?.url || icon.file?.url)
    ) {
      const imageUrl = icon.external?.url || icon.file?.url;
      const imageDimension = size === "small" ? 14 : size === "medium" ? 16 : 22;
      const isSvg = imageUrl?.toLowerCase().endsWith(".svg");

      return (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: imageDimension, height: imageDimension, borderRadius: 2 }}
          contentFit="contain"
          tintColor={isSvg ? iconColor : undefined}
        />
      );
    }

    // Fallback for any other case
    return <FallbackIcon size={iconSize} color={iconColor} strokeWidth={2} />;
  };

  return (
    <View className="flex-row items-center">
      {renderIcon()}
      {name && (
        <Text
          className={`ml-1 ${textSize} text-label-secondary dark:text-label-dark-secondary`}
        >
          {name}
        </Text>
      )}
    </View>
  );
}
