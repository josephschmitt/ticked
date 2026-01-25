import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useConfigStore } from "@/stores/configStore";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

export default function ListNameScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const customListName = useConfigStore((state) => state.customListName);
  const setCustomListName = useConfigStore((state) => state.setCustomListName);

  const [name, setName] = useState(customListName || "");

  const handleSave = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Save empty string as null to use database name as default
    await setCustomListName(name.trim() || null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  }, [name, setCustomListName, router]);

  const inputBgColor = isDark ? "#1C1C1E" : "#FFFFFF";
  const inputBorderColor = isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray4;

  return (
    <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 px-4 pt-5">
          <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary mb-4">
            Give your task list a custom name. Leave empty to use the database name "{databaseName}".
          </Text>

          <View
            className="rounded-[10px] px-4 py-3"
            style={{
              backgroundColor: inputBgColor,
              borderWidth: 1,
              borderColor: inputBorderColor,
            }}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={databaseName || "Enter list name"}
              placeholderTextColor={isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system}
              className="text-[17px] text-label-primary dark:text-label-dark-primary"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View className="px-4 py-4 border-t border-separator dark:border-separator-dark bg-background-elevated dark:bg-background-dark-elevated">
          <Pressable
            onPress={handleSave}
            className="py-4 rounded-[10px] items-center"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Text className="text-[17px] font-semibold text-white">
              Save
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
