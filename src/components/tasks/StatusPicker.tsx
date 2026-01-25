import { View, Text, Pressable, Modal, ScrollView, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { TaskStatus } from "@/types/task";
import { BRAND_COLORS, NOTION_COLORS, NotionColor } from "@/constants/colors";

interface StatusPickerProps {
  visible: boolean;
  statuses: TaskStatus[];
  selectedId: string | null;
  onSelect: (status: TaskStatus) => void;
  onCancel: () => void;
}

export function StatusPicker({
  visible,
  statuses,
  selectedId,
  onSelect,
  onCancel,
}: StatusPickerProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleSelect = (status: TaskStatus) => {
    Haptics.selectionAsync();
    onSelect(status);
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
            Status
          </Text>
          <View className="w-16" />
        </View>

        {/* Status list */}
        <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}>
          <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
            {statuses.map((status, index) => {
              const isLast = index === statuses.length - 1;
              const isSelected = selectedId === status.id;
              const colorKey = status.color as NotionColor;
              const bgColor = NOTION_COLORS[colorKey]
                ? (isDark ? NOTION_COLORS[colorKey].dark : NOTION_COLORS[colorKey].light)
                : (isDark ? NOTION_COLORS.default.dark : NOTION_COLORS.default.light);

              return (
                <View key={status.id}>
                  <Pressable
                    onPress={() => handleSelect(status)}
                    className="flex-row items-center px-4 py-3 min-h-[44px] active:opacity-70"
                  >
                    {/* Status color badge */}
                    <View
                      className="px-2.5 py-1 rounded-full mr-3"
                      style={{ backgroundColor: bgColor }}
                    >
                      <Text className="text-[13px] font-medium text-label-primary dark:text-label-dark-primary">
                        {status.name}
                      </Text>
                    </View>
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
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
