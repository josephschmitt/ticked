import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "@/stores/toastStore";
import { Toast } from "./Toast";

export function ToastContainer() {
  const insets = useSafeAreaInsets();
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <View
      className="absolute left-0 right-0 z-50"
      style={{ top: insets.top + 8 }}
      pointerEvents="box-none"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={hideToast}
        />
      ))}
    </View>
  );
}
