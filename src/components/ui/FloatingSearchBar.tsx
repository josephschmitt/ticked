import { useRef, useCallback, useMemo } from "react";
import { View, Text, TextInput, Pressable, useColorScheme, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { GlassWrapper } from "./GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

interface FloatingSearchBarProps {
  /** Callback when user starts typing (navigates to search) */
  onStartTyping?: (initialQuery: string) => void;
}

/**
 * Search bar with iOS 26-style glass effect.
 * Tapping focuses the input; typing triggers navigation to search screen.
 */
export function FloatingSearchBar({ onStartTyping }: FloatingSearchBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAvailable: isGlassAvailable } = useGlassEffect();
  const inputRef = useRef<TextInput>(null);
  const { fontSize, minHeight, iconSize, spacing } = useMacSizing();

  const iconColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const textColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";
  const fallbackBgColor = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.5)";

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      height: minHeight.floatingElement,
      borderRadius: minHeight.floatingElement / 2,
      overflow: "hidden",
    },
    glassView: {
      flex: 1,
      borderRadius: minHeight.floatingElement / 2,
      overflow: "hidden",
    },
    innerContainer: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: spacing.rowPaddingHorizontal,
      borderRadius: minHeight.floatingElement / 2,
    },
    input: {
      flex: 1,
      fontSize: fontSize.body,
      marginLeft: 10,
      paddingVertical: 0,
    },
  }), [fontSize.body, minHeight.floatingElement, spacing.rowPaddingHorizontal]);

  const handlePress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleChangeText = useCallback((text: string) => {
    if (text.length > 0 && onStartTyping) {
      // Blur the input before navigating
      inputRef.current?.blur();
      onStartTyping(text);
    }
  }, [onStartTyping]);

  return (
    <Pressable style={dynamicStyles.container} onPress={handlePress}>
      <GlassWrapper
        style={dynamicStyles.glassView}
        glassStyle="regular"
        isInteractive={false}
        fallbackIntensity={80}
        fallbackBackgroundColor={fallbackBgColor}
      >
        <View
          style={[
            dynamicStyles.innerContainer,
            !isGlassAvailable && {
              borderColor,
              borderWidth: 0.5,
              backgroundColor: fallbackBgColor,
            },
          ]}
        >
          <Search size={iconSize.medium} color={iconColor} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={[dynamicStyles.input, { color: textColor }]}
            placeholder="Search"
            placeholderTextColor={textColor}
            onChangeText={handleChangeText}
            value=""
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
      </GlassWrapper>
    </Pressable>
  );
}

