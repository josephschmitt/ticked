import { AccessibilityInfo, Platform } from "react-native";
import { useEffect, useState } from "react";

/**
 * Hook to check if screen reader is enabled.
 */
export function useScreenReaderEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Check initial state
    AccessibilityInfo.isScreenReaderEnabled().then(setIsEnabled);

    // Listen for changes
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Hook to check if reduce motion is enabled.
 */
export function useReduceMotionEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Hook to check if bold text is enabled (iOS only).
 */
export function useBoldTextEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    AccessibilityInfo.isBoldTextEnabled().then(setIsEnabled);

    const subscription = AccessibilityInfo.addEventListener(
      "boldTextChanged",
      setIsEnabled
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return isEnabled;
}

/**
 * Announce message to screen readers.
 */
export function announceForAccessibility(message: string): void {
  AccessibilityInfo.announceForAccessibility(message);
}
