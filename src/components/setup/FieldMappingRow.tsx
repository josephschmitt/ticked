import { View, Text, Pressable } from "react-native";
import type { DatabaseProperty } from "@/types/database";
import type { AppField } from "@/types/fieldMapping";
import { APP_FIELD_CONFIG } from "@/types/fieldMapping";

interface FieldMappingRowProps {
  appField: AppField;
  selectedProperty: DatabaseProperty | null;
  availableProperties: DatabaseProperty[];
  onPress: () => void;
}

export function FieldMappingRow({
  appField,
  selectedProperty,
  availableProperties,
  onPress,
}: FieldMappingRowProps) {
  const config = APP_FIELD_CONFIG[appField];
  const hasValidOptions = availableProperties.length > 0;

  return (
    <Pressable
      onPress={hasValidOptions ? onPress : undefined}
      disabled={!hasValidOptions}
      className={`
        flex-row items-center justify-between p-4 rounded-xl mb-3
        border border-gray-200 dark:border-gray-700
        ${hasValidOptions ? "bg-white dark:bg-gray-800 active:opacity-80" : "bg-gray-100 dark:bg-gray-900 opacity-50"}
      `}
    >
      <View className="flex-1 mr-4">
        <View className="flex-row items-center">
          <Text className="text-base font-medium text-gray-900 dark:text-white">
            {config.label}
          </Text>
          {config.required && (
            <Text className="text-red-500 ml-1">*</Text>
          )}
        </View>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {config.description}
        </Text>
      </View>

      <View className="flex-row items-center">
        {selectedProperty ? (
          <View className="bg-primary-100 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg">
            <Text className="text-primary-700 dark:text-primary-300 font-medium">
              {selectedProperty.name}
            </Text>
          </View>
        ) : hasValidOptions ? (
          <Text className="text-gray-400 dark:text-gray-500">
            Select...
          </Text>
        ) : (
          <Text className="text-gray-400 dark:text-gray-600 text-sm">
            No matching properties
          </Text>
        )}
        {hasValidOptions && (
          <Text className="text-gray-400 ml-2">›</Text>
        )}
      </View>
    </Pressable>
  );
}
