import { View, Text, Pressable, useColorScheme } from "react-native";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react-native";
import Animated, {
  FadeInUp,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { ToastType } from "@/stores/toastStore";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onDismiss: (id: string) => void;
}

const TOAST_COLORS = {
  success: {
    bg: "rgba(52, 199, 89, 0.95)",
    icon: "#FFFFFF",
  },
  error: {
    bg: "rgba(255, 59, 48, 0.95)",
    icon: "#FFFFFF",
  },
  info: {
    bg: "rgba(0, 122, 255, 0.95)",
    icon: "#FFFFFF",
  },
};

export function Toast({ id, message, type, onDismiss }: ToastProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = TOAST_COLORS[type];

  const handleDismiss = () => {
    Haptics.selectionAsync();
    onDismiss(id);
  };

  const Icon = type === "success" ? CheckCircle2 : type === "error" ? AlertCircle : Info;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20)}
      exiting={FadeOutUp.springify().damping(20)}
      layout={Layout.springify()}
      className="mx-4 mb-2"
    >
      <Pressable
        onPress={handleDismiss}
        className="flex-row items-center px-4 py-3 rounded-xl shadow-lg"
        style={{ backgroundColor: colors.bg }}
      >
        <Icon size={20} color={colors.icon} strokeWidth={2} />
        <Text className="flex-1 text-[15px] font-medium text-white ml-3" numberOfLines={2}>
          {message}
        </Text>
        <Pressable
          onPress={handleDismiss}
          className="ml-2 p-1"
          hitSlop={8}
        >
          <X size={18} color="rgba(255,255,255,0.8)" strokeWidth={2} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}
