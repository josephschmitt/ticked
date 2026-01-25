import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FieldMappingScreen() {
  // Will be implemented in Milestone 7
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-gray-600 dark:text-gray-400 text-center">
          Configure field mapping...
        </Text>
      </View>
    </SafeAreaView>
  );
}
