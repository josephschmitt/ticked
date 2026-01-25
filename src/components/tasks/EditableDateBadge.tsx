import { useState } from "react";
import { View, Pressable, Platform, Modal, Text, useColorScheme } from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { DateBadge } from "@/components/ui/DateBadge";
import { BRAND_COLORS } from "@/constants/colors";

interface EditableDateBadgeProps {
  date: string | undefined;
  type: "do" | "due";
  isComplete?: boolean;
  size?: "small" | "medium";
  approachingDaysThreshold?: number;
  onDateChange: (date: string | null) => void;
  placeholder?: string;
}

/**
 * An editable date badge that opens a native date picker on press.
 * Wraps DateBadge with tap-to-edit functionality.
 */
export function EditableDateBadge({
  date,
  type,
  isComplete = false,
  size = "small",
  approachingDaysThreshold = 2,
  onDateChange,
  placeholder = "Add date",
}: EditableDateBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showPicker, setShowPicker] = useState(false);

  // Parse date or use today as default
  const dateValue = date ? new Date(date) : new Date();

  const handlePress = () => {
    Haptics.selectionAsync();
    setShowPicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      // Format as ISO date string (YYYY-MM-DD)
      const isoDate = selectedDate.toISOString().split("T")[0];
      onDateChange(isoDate);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (Platform.OS === "ios") {
        setShowPicker(false);
      }
    } else if (event.type === "dismissed") {
      setShowPicker(false);
    }
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    onDateChange(null);
    setShowPicker(false);
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    setShowPicker(false);
  };

  const handleDone = () => {
    Haptics.selectionAsync();
    // Format as ISO date string (YYYY-MM-DD)
    const isoDate = dateValue.toISOString().split("T")[0];
    onDateChange(isoDate);
    setShowPicker(false);
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        className="active:opacity-70"
        hitSlop={8}
      >
        {date ? (
          <DateBadge
            date={date}
            type={type}
            isComplete={isComplete}
            size={size}
            approachingDaysThreshold={approachingDaysThreshold}
          />
        ) : (
          <Text className="text-[13px] text-label-tertiary dark:text-label-dark-tertiary">
            {placeholder}
          </Text>
        )}
      </Pressable>

      {Platform.OS === "ios" ? (
        <Modal
          visible={showPicker}
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
                {type === "do" ? "Do Date" : "Due Date"}
              </Text>
              <Pressable onPress={handleDone} className="px-2 py-1">
                <Text className="text-[17px] font-semibold" style={{ color: BRAND_COLORS.primary }}>
                  Done
                </Text>
              </Pressable>
            </View>

            {/* Date picker */}
            <View className="flex-1 justify-center items-center">
              <DateTimePicker
                value={dateValue}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                themeVariant={isDark ? "dark" : "light"}
              />
            </View>

            {/* Clear button */}
            {date && (
              <View className="px-4 pb-4">
                <Pressable
                  onPress={handleClear}
                  className="py-3 items-center rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated"
                >
                  <Text className="text-[17px] text-ios-red">
                    Clear Date
                  </Text>
                </Pressable>
              </View>
            )}
          </SafeAreaView>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )
      )}
    </>
  );
}
