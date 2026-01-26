import { useEffect } from "react";
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

  // Calculate base padding
  const bottomPadding = Math.max(insets.bottom, 12);

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
      <View style={styles.gap} />
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
        style={[styles.container, containerStyle, animatedStyle]}
        spacing={12}
      >
        {content}
      </AnimatedGlassContainer>
    );
  }

  return (
    <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
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
  gap: {
    width: 12,
  },
});
