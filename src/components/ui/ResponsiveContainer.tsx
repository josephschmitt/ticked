import { View, ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface ResponsiveContainerProps {
  children: ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}

/**
 * A container that applies max-width and centers content on wide screens.
 * On narrow screens, content fills the available width.
 */
export function ResponsiveContainer({
  children,
  maxWidth,
  style,
}: ResponsiveContainerProps) {
  const { shouldConstrain, maxWidth: effectiveMaxWidth } = useResponsiveLayout(maxWidth);

  return (
    <View
      style={[
        {
          width: shouldConstrain ? effectiveMaxWidth : "100%",
          alignSelf: "center",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
