import { useMemo } from "react";
import { View, Text, Pressable, Modal, ScrollView, useColorScheme, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { RelationOption } from "@/services/notion/operations/getRelationOptions";
import { RelationBadge } from "@/components/ui/RelationBadge";
import { BRAND_COLORS } from "@/constants/colors";

interface RelationPickerProps {
  visible: boolean;
  title: string;
  options: RelationOption[];
  selectedId: string | null;
  onSelect: (option: RelationOption | null) => void;
  onCancel: () => void;
  allowClear?: boolean;
  isLoading?: boolean;
}

export function RelationPicker({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onCancel,
  allowClear = true,
  isLoading = false,
}: RelationPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const sortedOptions = useMemo(
    () => [...options].sort((a, b) => a.title.localeCompare(b.title)),
    [options]
  );

  const handleSelect = (option: RelationOption | null) => {
    Haptics.selectionAsync();
    onSelect(option);
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-separator dark:border-separator-dark bg-background-elevated dark:bg-background-dark-elevated">
          <Pressable onPress={handleCancel} className="px-2 py-1">
            <Text className="text-[17px]" style={{ color: BRAND_COLORS.primary }}>
              Cancel
            </Text>
          </Pressable>
          <Text className="text-[17px] font-semibold text-label-primary dark:text-label-dark-primary">
            {title}
          </Text>
          <View className="w-16" />
        </View>

        {/* Options list */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}>
          {isLoading ? (
            <View className="py-8 items-center">
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            </View>
          ) : (
            <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
              {/* Clear option */}
              {allowClear && (
                <>
                  <Pressable
                    onPress={() => handleSelect(null)}
                    className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
                  >
                    <Text className="flex-1 text-[17px] text-label-secondary dark:text-label-dark-secondary">
                      None
                    </Text>
                    {selectedId === null && (
                      <Check size={20} color={BRAND_COLORS.primary} strokeWidth={3} />
                    )}
                  </Pressable>
                  {sortedOptions.length > 0 && (
                    <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
                  )}
                </>
              )}

              {sortedOptions.map((option, index) => {
                const isLast = index === sortedOptions.length - 1;
                const isSelected = selectedId === option.id;

                return (
                  <View key={option.id}>
                    <Pressable
                      onPress={() => handleSelect(option)}
                      className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
                    >
                      <RelationBadge
                        name={option.title}
                        icon={option.icon}
                        fallbackIcon={FileText}
                        size="medium"
                      />
                      <View className="flex-1" />
                      {isSelected && (
                        <Check size={20} color={BRAND_COLORS.primary} strokeWidth={3} />
                      )}
                    </Pressable>
                    {!isLast && (
                      <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
                    )}
                  </View>
                );
              })}

              {sortedOptions.length === 0 && !allowClear && (
                <View className="py-8 items-center">
                  <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary">
                    No options available
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
