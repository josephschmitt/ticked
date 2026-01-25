import { View, Text, Pressable, Modal, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import type { DatabaseProperty } from "@/types/database";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const totalItems = properties.length + (!required && onClear ? 1 : 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-separator dark:border-separator-dark bg-background-elevated dark:bg-background-dark-elevated">
          <Pressable onPress={onCancel} className="px-2 py-1">
            <Text className="text-[17px]" style={{ color: BRAND_COLORS.primary }}>
              Cancel
            </Text>
          </Pressable>
          <Text className="text-[17px] font-semibold text-label-primary dark:text-label-dark-primary">
            {title}
          </Text>
          <View className="w-16" />
        </View>

        {/* Property list */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}>
          <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
            {!required && onClear && (
              <>
                <Pressable
                  onPress={onClear}
                  className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
                >
                  <Text className="flex-1 text-[17px] text-label-secondary dark:text-label-dark-secondary">
                    None (skip this field)
                  </Text>
                  {selectedId === null && (
                    <Check size={20} color={BRAND_COLORS.primary} strokeWidth={3} />
                  )}
                </Pressable>
                {properties.length > 0 && (
                  <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
                )}
              </>
            )}

            {properties.map((property, index) => {
              const isLast = index === properties.length - 1;
              return (
                <View key={property.id}>
                  <Pressable
                    onPress={() => onSelect(property)}
                    className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
                  >
                    <View className="flex-1">
                      <Text className="text-[17px] text-label-primary dark:text-label-dark-primary">
                        {property.name}
                      </Text>
                      <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary mt-0.5">
                        {property.type}
                      </Text>
                    </View>
                    {selectedId === property.id && (
                      <Check size={20} color={BRAND_COLORS.primary} strokeWidth={3} />
                    )}
                  </Pressable>
                  {!isLast && (
                    <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
