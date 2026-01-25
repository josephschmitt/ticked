import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LandingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Notion Todos
        </Text>
        <Text className="text-lg text-gray-600 dark:text-gray-400 text-center mb-12">
          A native todo experience powered by your Notion workspace
        </Text>

        <Pressable
          className="bg-primary-600 px-8 py-4 rounded-xl active:bg-primary-700"
          onPress={() => {
            // Will be implemented in Milestone 5
            console.log("Connect to Notion");
          }}
        >
          <Text className="text-white text-lg font-semibold">
            Connect to Notion
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
