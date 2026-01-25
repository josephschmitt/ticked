import { View, Text, Pressable, Image, useColorScheme } from "react-native";
import { Check, Database } from "lucide-react-native";
import type { NotionDatabase } from "@/types/database";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface DatabaseCardProps {
  database: NotionDatabase;
  isSelected: boolean;
  onSelect: () => void;
  isLast?: boolean;
}

export function DatabaseCard({
  database,
  isSelected,
  onSelect,
  isLast = false,
}: DatabaseCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const iconBgColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray5;

  return (
    <>
      <Pressable
        onPress={onSelect}
        className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
      >
        {/* Icon */}
        <View
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: iconBgColor }}
        >
          {database.icon?.type === "emoji" ? (
            <Text className="text-xl">{database.icon.emoji}</Text>
          ) : database.icon?.type === "external" || database.icon?.type === "file" ? (
            <Image
              source={{
                uri:
                  database.icon.external?.url || database.icon.file?.url || "",
              }}
              className="w-6 h-6 rounded"
            />
          ) : (
            <Database size={20} color={isDark ? IOS_GRAYS.gray6 : IOS_GRAYS.system} strokeWidth={1.5} />
          )}
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-[17px] text-label-primary dark:text-label-dark-primary"
            numberOfLines={1}
          >
            {database.title}
          </Text>
          {database.description && (
            <Text
              className="text-[15px] text-label-secondary dark:text-label-dark-secondary mt-0.5"
              numberOfLines={2}
            >
              {database.description}
            </Text>
          )}
        </View>

        {/* Selected indicator */}
        {isSelected && (
          <Check size={22} color={BRAND_COLORS.primary} strokeWidth={3} />
        )}
      </Pressable>

      {/* Separator */}
      {!isLast && (
        <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-[68px]" />
      )}
    </>
  );
}
