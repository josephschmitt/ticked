import { View, Text, useColorScheme } from "react-native";
import { CalendarCheck, CalendarClock } from "lucide-react-native";
import { IOS_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

type DateType = "do" | "due";
type Urgency = "normal" | "approaching" | "overdue";

interface DateBadgeProps {
  date: string;
  type: DateType;
  isComplete?: boolean;
  size?: "small" | "medium";
  approachingDaysThreshold?: number;
}

/**
 * Format a date string for display.
 * Returns "Today", "Tomorrow", or "Mon 15" format.
 */
export function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Determine urgency level based on how close/past the date is.
 * @param dateStr - The date string to check
 * @param approachingThreshold - Number of days to consider "approaching" (default: 2, -1 to disable)
 */
export function getDateUrgency(dateStr: string, approachingThreshold: number = 2): Urgency {
  const date = new Date(dateStr);
  const today = new Date();
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (approachingThreshold >= 0 && diffDays <= approachingThreshold) return "approaching";
  return "normal";
}

/**
 * Get the icon color based on urgency and completion state.
 */
function getIconColor(urgency: Urgency, isComplete: boolean, secondaryColor: string): string {
  if (isComplete) return secondaryColor;

  switch (urgency) {
    case "overdue":
      return IOS_COLORS.red;
    case "approaching":
      return IOS_COLORS.yellow;
    default:
      return secondaryColor;
  }
}

/**
 * Reusable date badge component with urgency-based coloring.
 *
 * - "do" dates use CalendarCheck icon, no urgency coloring
 * - "due" dates use CalendarClock icon, colored by urgency (red=overdue, yellow=approaching)
 */
export function DateBadge({ date, type, isComplete = false, size = "small", approachingDaysThreshold = 2 }: DateBadgeProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fontSize, iconSize: macIconSize } = useMacSizing();

  const secondaryColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;
  const urgency = getDateUrgency(date, approachingDaysThreshold);
  const iconColor = getIconColor(urgency, isComplete, secondaryColor);

  const badgeIconSize = size === "small" ? macIconSize.small : macIconSize.small * 1.2;
  const textFontSize = size === "small" ? fontSize.secondary : fontSize.caption;
  const Icon = type === "do" ? CalendarCheck : CalendarClock;
  const displayDate = formatDisplayDate(date);

  return (
    <View className="flex-row items-center gap-1">
      <Icon size={badgeIconSize} color={iconColor} strokeWidth={2} />
      <Text
        className="text-label-secondary dark:text-label-dark-secondary"
        style={{ fontSize: textFontSize }}
      >
        {displayDate}
      </Text>
    </View>
  );
}
