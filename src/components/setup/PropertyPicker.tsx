import { View, Text, Pressable, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DatabaseProperty } from "@/types/database";

interface PropertyPickerProps {
  visible: boolean;
  title: string;
  properties: DatabaseProperty[];
  selectedId: string | null;
  onSelect: (property: DatabaseProperty) => void;
  onCancel: () => void;
  onClear?: () => void;
  required?: boolean;
}

export function PropertyPicker({
  visible,
  title,
  properties,
  selectedId,
  onSelect,
  onCancel,
  onClear,
  required = false,
}: PropertyPickerProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView className="flex-1 bg-white dark:bg-black">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <Pressable onPress={onCancel} className="px-2 py-1">
            <Text className="text-primary-600 text-base">Cancel</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </Text>
          <View className="w-16" />
        </View>

        {/* Property list */}
        <ScrollView className="flex-1 px-4 py-4">
          {!required && onClear && (
            <Pressable
              onPress={onClear}
              className={`
                flex-row items-center p-4 rounded-xl mb-3 border
                ${
                  selectedId === null
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }
              `}
            >
              <Text className="text-gray-500 dark:text-gray-400 flex-1">
                None (skip this field)
              </Text>
              {selectedId === null && (
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </Pressable>
          )}

          {properties.map((property) => (
            <Pressable
              key={property.id}
              onPress={() => onSelect(property)}
              className={`
                flex-row items-center p-4 rounded-xl mb-3 border
                ${
                  selectedId === property.id
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }
              `}
            >
              <View className="flex-1">
                <Text
                  className={`text-base font-medium ${
                    selectedId === property.id
                      ? "text-primary-700 dark:text-primary-300"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {property.name}
                </Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {property.type}
                </Text>
              </View>
              {selectedId === property.id && (
                <View className="w-5 h-5 rounded-full bg-primary-500 items-center justify-center">
                  <Text className="text-white text-xs">✓</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
