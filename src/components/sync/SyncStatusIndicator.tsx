import { View, Text, Pressable, useColorScheme, ActivityIndicator } from "react-native";
import { Cloud, CloudOff, AlertTriangle, RefreshCw } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useMutationQueueStore } from "@/stores/mutationQueueStore";
import { useNetworkState } from "@/hooks/useNetworkState";
import { IOS_GRAYS, BRAND_COLORS } from "@/constants/colors";
import type { SyncStatus } from "@/types/mutation";

interface SyncStatusIndicatorProps {
  /** Callback when indicator is pressed */
  onPress?: () => void;
}

/**
 * Indicator showing current sync status (syncing, pending changes, conflicts).
 */
export function SyncStatusIndicator({ onPress }: SyncStatusIndicatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const syncStatus = useMutationQueueStore((state) => state.syncStatus);
  const pendingCount = useMutationQueueStore((state) => state.queue.length);
  const conflictCount = useMutationQueueStore((state) => state.getPendingConflictsCount());
  const { isOffline } = useNetworkState();

  // Don't show anything if everything is synced and online
  if (syncStatus === "idle" && pendingCount === 0 && conflictCount === 0 && !isOffline) {
    return null;
  }

  const getStatusConfig = () => {
    if (conflictCount > 0) {
      return {
        icon: AlertTriangle,
        color: "#FF9500", // iOS orange
        text: `${conflictCount} conflict${conflictCount > 1 ? "s" : ""}`,
        showActivity: false,
      };
    }

    if (syncStatus === "syncing") {
      return {
        icon: RefreshCw,
        color: BRAND_COLORS.primary,
        text: "Syncing...",
        showActivity: true,
      };
    }

    if (pendingCount > 0) {
      return {
        icon: isOffline ? CloudOff : Cloud,
        color: isOffline ? IOS_GRAYS.gray3 : BRAND_COLORS.primary,
        text: `${pendingCount} pending`,
        showActivity: false,
      };
    }

    if (syncStatus === "error") {
      return {
        icon: AlertTriangle,
        color: "#FF3B30", // iOS red
        text: "Sync error",
        showActivity: false,
      };
    }

    return null;
  };

  const config = getStatusConfig();
  if (!config) return null;

  const Icon = config.icon;
  const textColor = isDark ? IOS_GRAYS.gray4 : IOS_GRAYS.gray2;

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
        }}
      >
        {config.showActivity ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <Icon size={14} color={config.color} strokeWidth={2} />
        )}
        <Text
          className="text-[12px] font-medium ml-1.5"
          style={{ color: textColor }}
        >
          {config.text}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
