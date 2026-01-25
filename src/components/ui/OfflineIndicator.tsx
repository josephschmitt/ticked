import { View, Text, useColorScheme } from "react-native";
import { WifiOff } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useNetworkState } from "@/hooks/useNetworkState";
import { IOS_GRAYS } from "@/constants/colors";

interface OfflineIndicatorProps {
  /** Whether to show the indicator as a banner (full width) or compact badge */
  variant?: "banner" | "badge";
}

/**
 * Visual indicator shown when the device is offline.
 */
export function OfflineIndicator({ variant = "badge" }: OfflineIndicatorProps) {
  const { isOffline, isInitialized } = useNetworkState();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Don't show until network state is initialized
  if (!isInitialized || !isOffline) {
    return null;
  }

  const backgroundColor = isDark
    ? "rgba(255, 159, 10, 0.9)" // iOS orange
    : "rgba(255, 149, 0, 0.95)";

  if (variant === "banner") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="flex-row items-center justify-center px-4 py-2"
        style={{ backgroundColor }}
      >
        <WifiOff size={16} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="text-white text-[13px] font-semibold ml-2">
          You're offline
        </Text>
      </Animated.View>
    );
  }

  // Badge variant (compact)
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      className="flex-row items-center px-3 py-1.5 rounded-full"
      style={{ backgroundColor }}
    >
      <WifiOff size={14} color="#FFFFFF" strokeWidth={2.5} />
      <Text className="text-white text-[12px] font-semibold ml-1.5">
        Offline
      </Text>
    </Animated.View>
  );
}
