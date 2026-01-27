import { useEffect, useMemo } from "react";
import { View, StyleSheet, Keyboard, Platform, KeyboardEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassContainer } from "expo-glass-effect";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useGlassEffect } from "@/hooks/useGlassEffect";
import { FloatingSearchBar } from "./FloatingSearchBar";
import { FloatingPlusButton } from "./FloatingPlusButton";
import { useMacSizing } from "@/hooks/useMacSizing";

interface FloatingActionBarProps {
  onCreatePress: () => void;
  onStartSearch?: (initialQuery: string) => void;
}

const AnimatedGlassContainer = Animated.createAnimatedComponent(GlassContainer);

/**
 * Floating action bar positioned at the bottom of the screen.
 * Contains a search bar and a create button.
 * Animates up with keyboard.
 */
export function FloatingActionBar({ onCreatePress, onStartSearch }: FloatingActionBarProps) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding, shouldConstrain } = useResponsiveLayout();
  const { isAvailable: isGlassAvailable } = useGlassEffect();
  const { minHeight } = useMacSizing();

  // Calculate base padding
  const bottomPadding = Math.max(insets.bottom, 12);

  const dynamicStyles = useMemo(() => StyleSheet.create({
    container: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      height: minHeight.floatingElement,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    gap: {
      width: 12,
    },
  }), [minHeight.floatingElement]);

  // Keyboard animation
  const keyboardHeight = useSharedValue(0);

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

  // Animated style for bottom position
  const animatedStyle = useAnimatedStyle(() => {
    const keyboardOffset = Platform.OS === "ios" ? keyboardHeight.value : 0;
    return {
      bottom: keyboardOffset > 0 ? keyboardOffset + 8 : bottomPadding,
    };
  });

  const content = (
    <>
      <FloatingSearchBar onStartTyping={onStartSearch} />
      <View style={dynamicStyles.gap} />
      <FloatingPlusButton onPress={onCreatePress} />
    </>
  );

  const containerStyle = {
    paddingHorizontal: shouldConstrain ? horizontalPadding + 16 : 16,
  };

  // Use GlassContainer on iOS 26+ to enable glass element interaction
  if (isGlassAvailable) {
    return (
      <AnimatedGlassContainer
        style={[dynamicStyles.container, containerStyle, animatedStyle]}
        spacing={12}
      >
        {content}
      </AnimatedGlassContainer>
    );
  }

  return (
    <Animated.View style={[dynamicStyles.container, containerStyle, animatedStyle]}>
      {content}
    </Animated.View>
  );
}

