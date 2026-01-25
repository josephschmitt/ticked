import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CallbackScreen() {
  // Will be implemented in Milestone 5
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-4 text-gray-600 dark:text-gray-400">
          Completing authentication...
        </Text>
      </View>
    </SafeAreaView>
  );
}
