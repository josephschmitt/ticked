import { useRef, useCallback } from "react";
import { View, Text, TextInput, Pressable, useColorScheme, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { GlassWrapper } from "./GlassWrapper";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { IOS_GRAYS } from "@/constants/colors";

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

  const iconColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const textColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";
  const fallbackBgColor = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.5)";

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
    <Pressable style={styles.container} onPress={handlePress}>
      <GlassWrapper
        style={styles.glassView}
        glassStyle="regular"
        isInteractive={false}
        fallbackIntensity={80}
        fallbackBackgroundColor={fallbackBgColor}
      >
        <View
          style={[
            styles.innerContainer,
            !isGlassAvailable && {
              borderColor,
              borderWidth: 0.5,
              backgroundColor: fallbackBgColor,
            },
          ]}
        >
          <Search size={18} color={iconColor} strokeWidth={2} />
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: textColor }]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  glassView: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  innerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  input: {
    flex: 1,
    fontSize: 17,
    marginLeft: 10,
    paddingVertical: 0,
  },
});
