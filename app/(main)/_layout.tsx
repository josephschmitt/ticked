import { useCallback } from "react";
import { Stack, useRouter, usePathname } from "expo-router";
import { View, useColorScheme, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { BRAND_COLORS, IOS_BACKGROUNDS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { ConflictBanner } from "@/components/sync/ConflictBanner";
import { GlobalSearchBar } from "@/components/search/GlobalSearchBar";

// iOS 26+ handles header blur automatically; older versions need explicit blur
const getIOSVersion = (): number => {
  if (Platform.OS !== "ios") return 0;
  return parseInt(Platform.Version as string, 10);
};
const isIOS26OrLater = getIOSVersion() >= 26;

export default function MainLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  const { shouldConstrain, maxWidth } = useResponsiveLayout();

  const headerBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;
  const contentBg = isDark ? IOS_BACKGROUNDS.grouped.dark : IOS_BACKGROUNDS.grouped.light;

  // On iOS, headerTransparent is needed for large title to work properly
  const isIOS = Platform.OS === "ios";

  // Determine if we should show the floating action bar
  // Hide on modals, settings, task detail screens
  const showFloatingBar = pathname === "/" || pathname === "/search" || pathname === "/done";

  const handleCreatePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(main)/task/new");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: contentBg, alignItems: "center" }}>
      {/* Offline indicator banner at top */}
      <View style={{ width: shouldConstrain ? maxWidth : "100%" }}>
        <OfflineIndicator variant="banner" />
      </View>
      <View style={{ flex: 1, width: shouldConstrain ? maxWidth : "100%" }}>
        {/* Conflict banner */}
        <ConflictBanner />
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: isIOS ? undefined : { backgroundColor: headerBg },
            headerTintColor: BRAND_COLORS.primary,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: contentBg },
            headerTransparent: isIOS,
            headerBlurEffect: isIOS ? (isIOS26OrLater ? undefined : "regular") : undefined,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Tasks",
              headerLargeTitleEnabled: true,
            }}
          />
          <Stack.Screen
            name="done"
            options={{
              title: "Done",
              headerLargeTitleEnabled: true,
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="task/[id]"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.4, 1.0],
              sheetGrabberVisible: true,
              sheetInitialDetentIndex: 0,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="task/new"
            options={{
              presentation: "formSheet",
              sheetAllowedDetents: [0.4, 1.0],
              sheetGrabberVisible: true,
              sheetInitialDetentIndex: 0,
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="conflicts"
            options={{
              title: "Sync Conflicts",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
        </Stack>

        {/* Global floating action bar */}
        {showFloatingBar && (
          <GlobalSearchBar onCreatePress={handleCreatePress} />
        )}
      </View>
    </View>
  );
}
