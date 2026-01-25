import { View, Text, Pressable, Image } from "react-native";
import type { NotionDatabase } from "@/types/database";

interface DatabaseCardProps {
  database: NotionDatabase;
  isSelected: boolean;
  onSelect: () => void;
}

export function DatabaseCard({
  database,
  isSelected,
  onSelect,
}: DatabaseCardProps) {
  const iconContent = database.icon?.emoji || "📋";

  return (
    <Pressable
      onPress={onSelect}
      className={`
        flex-row items-center p-4 rounded-xl mb-3 border-2
        ${
          isSelected
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }
        active:opacity-80
      `}
    >
      {/* Icon */}
      <View className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 items-center justify-center mr-4">
        {database.icon?.type === "emoji" ? (
          <Text className="text-2xl">{database.icon.emoji}</Text>
        ) : database.icon?.type === "external" || database.icon?.type === "file" ? (
          <Image
            source={{
              uri:
                database.icon.external?.url || database.icon.file?.url || "",
            }}
            className="w-8 h-8 rounded"
          />
        ) : (
          <Text className="text-2xl">{iconContent}</Text>
        )}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className={`text-lg font-semibold ${
            isSelected
              ? "text-primary-700 dark:text-primary-300"
              : "text-gray-900 dark:text-white"
          }`}
          numberOfLines={1}
        >
          {database.title}
        </Text>
        {database.description ? (
          <Text
            className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            numberOfLines={2}
          >
            {database.description}
          </Text>
        ) : null}
      </View>

      {/* Selected indicator */}
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-primary-500 items-center justify-center ml-2">
          <Text className="text-white text-sm">✓</Text>
        </View>
      )}
    </Pressable>
  );
}
