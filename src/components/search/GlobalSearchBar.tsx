import { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  useColorScheme,
  Keyboard,
  Platform,
  KeyboardEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import { GlassContainer } from "expo-glass-effect";
import { Search, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSearchStore } from "@/stores/searchStore";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { GlassWrapper } from "@/components/ui/GlassWrapper";
import { FloatingPlusButton } from "@/components/ui/FloatingPlusButton";
import { IOS_GRAYS } from "@/constants/colors";

interface GlobalSearchBarProps {
  onCreatePress: () => void;
}

const AnimatedGlassContainer = Animated.createAnimatedComponent(GlassContainer);

/**
 * Global search bar that persists across navigation.
 * Lives at the layout level so it maintains focus during screen transitions.
 */
export function GlobalSearchBar({ onCreatePress }: GlobalSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();
  const { horizontalPadding, shouldConstrain } = useResponsiveLayout();
  const { isAvailable: isGlassAvailable } = useGlassEffect();
  const inputRef = useRef<TextInput>(null);

  // Search state from store
  const { query, setQuery, reset } = useSearchStore();

  // Determine if we're on the search screen
  const isOnSearchScreen = pathname === "/search";

  // Animation values
  const keyboardHeight = useSharedValue(0);

  // Track if we're in "search mode" (focused or on search screen)
  const [isSearchActive, setIsSearchActive] = useState(isOnSearchScreen);

  // Track keyboard height
  useEffect(() => {
    const showListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event: KeyboardEvent) => {
        keyboardHeight.value = withTiming(event.endCoordinates.height, { duration: 250 });
      }
    );
    const hideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardHeight.value = withTiming(0, { duration: 250 });
      }
    );

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [keyboardHeight]);

  // Sync search active state with route
  useEffect(() => {
    if (isOnSearchScreen) {
      setIsSearchActive(true);
    }
  }, [isOnSearchScreen]);

  const handleFocus = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Only deactivate if not on search screen
    if (!isOnSearchScreen) {
      setIsSearchActive(false);
    }
  }, [isOnSearchScreen]);

  // Handle text changes - navigate to search on first character
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);

    // Navigate to search screen when user starts typing (if not already there)
    if (text.length > 0 && !isOnSearchScreen) {
      router.push("/(main)/search");
    }
  }, [setQuery, isOnSearchScreen, router]);

  const handleClear = useCallback(() => {
    Haptics.selectionAsync();
    setQuery("");
    inputRef.current?.focus();
  }, [setQuery]);

  const handleCancel = useCallback(() => {
    Haptics.selectionAsync();
    reset();
    Keyboard.dismiss();
    setIsSearchActive(false);
    if (isOnSearchScreen) {
      router.back();
    }
  }, [reset, isOnSearchScreen, router]);

  const handleSearchBarPress = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Colors
  const bottomPadding = Math.max(insets.bottom, 12);
  const iconColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const textColor = isDark ? "#FFFFFF" : "#000000";
  const placeholderColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.system;
  const borderColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)";
  const fallbackBgColor = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.5)";

  // Animated style for container position
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = Platform.OS === "ios" ? keyboardHeight.value : 0;
    return {
      bottom: keyboardOffset > 0 ? keyboardOffset + 8 : bottomPadding,
    };
  });


  const searchBarContent = (
    <View
      style={[
        styles.searchInnerContainer,
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
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Search"
        placeholderTextColor={placeholderColor}
        style={[styles.searchInput, { color: textColor }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <Pressable onPress={handleClear} hitSlop={8} style={styles.clearButton}>
          <X size={18} color={iconColor} strokeWidth={2} />
        </Pressable>
      )}
    </View>
  );

  const content = (
    <>
      <Pressable style={styles.searchBarContainer} onPress={handleSearchBarPress}>
        <GlassWrapper
          style={styles.searchGlassView}
          glassStyle="regular"
          isInteractive={false}
          fallbackIntensity={80}
          fallbackBackgroundColor={fallbackBgColor}
        >
          {searchBarContent}
        </GlassWrapper>
      </Pressable>

      <View style={styles.actionButtonWrapper}>
        {isSearchActive ? (
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
          >
            <GlassWrapper
              style={styles.actionGlassView}
              glassStyle="regular"
              tintColor="#FFFFFF"
              isInteractive={false}
              fallbackIntensity={80}
              fallbackBackgroundColor="rgba(255,255,255,0.9)"
            >
              <View
                style={[
                  styles.actionInnerContainer,
                  !isGlassAvailable && {
                    borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
                    backgroundColor: "rgba(255,255,255,0.9)",
                  },
                ]}
              >
                <X size={24} color="#000000" strokeWidth={2.5} />
              </View>
            </GlassWrapper>
          </Pressable>
        ) : (
          <FloatingPlusButton onPress={onCreatePress} />
        )}
      </View>
    </>
  );

  const containerStyle = {
    paddingHorizontal: shouldConstrain ? horizontalPadding + 16 : 16,
  };

  if (isGlassAvailable) {
    return (
      <AnimatedGlassContainer
        style={[styles.container, containerStyle, containerAnimatedStyle]}
        spacing={12}
      >
        {content}
      </AnimatedGlassContainer>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle, containerAnimatedStyle]}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
  },
  searchBarContainer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  searchGlassView: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  searchInnerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 17,
    lineHeight: 22,
    marginLeft: 10,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  actionButtonWrapper: {
    marginLeft: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  actionGlassView: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  actionInnerContainer: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderRadius: 24,
    borderColor: "transparent",
  },
});
