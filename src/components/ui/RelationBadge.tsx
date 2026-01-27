import { View, Text, useColorScheme } from "react-native";
import { Image } from "expo-image";
import type { LucideIcon } from "lucide-react-native";
import type { DatabaseIcon } from "@/types/database";
import { IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

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
  const { fontSize, iconSize: macIconSize } = useMacSizing();

  const badgeIconSize = size === "small" ? macIconSize.small * 1.1 : size === "medium" ? macIconSize.medium : macIconSize.large;
  const emojiFontSize = size === "small" ? fontSize.caption * 0.9 : size === "medium" ? fontSize.caption * 1.1 : fontSize.body * 1.15;
  const textFontSize = size === "small" ? fontSize.secondary : fontSize.caption;
  const iconColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  const renderIcon = () => {
    if (!icon) {
      return <FallbackIcon size={badgeIconSize} color={iconColor} strokeWidth={2} />;
    }

    if (icon.type === "emoji" && icon.emoji) {
      return <Text style={{ fontSize: emojiFontSize }}>{icon.emoji}</Text>;
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
            opacity: isSvg ? 1 : 0.75,
          }}
          contentFit="contain"
          tintColor={isSvg ? iconColor : undefined}
        />
      );
    }

    // Fallback for any other case
    return <FallbackIcon size={badgeIconSize} color={iconColor} strokeWidth={2} />;
  };

  return (
    <View className="flex-row items-center">
      {renderIcon()}
      {name && (
        <Text
          className="ml-1 text-label-secondary dark:text-label-dark-secondary"
          style={{ fontSize: textFontSize }}
        >
          {name}
        </Text>
      )}
    </View>
  );
}
