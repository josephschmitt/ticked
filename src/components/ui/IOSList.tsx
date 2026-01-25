import { View, Text, Pressable, useColorScheme } from "react-native";
import { ChevronRight, Check } from "lucide-react-native";
import { Separator } from "./Separator";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";

interface IOSListProps {
  header?: string;
  footer?: string;
  children: React.ReactNode;
}

export function IOSList({ header, footer, children }: IOSListProps) {
  return (
    <View className="mb-6">
      {header && (
        <Text className="text-[13px] font-normal text-label-secondary dark:text-label-dark-secondary uppercase px-4 mb-1.5">
          {header}
        </Text>
      )}
      <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
        {children}
      </View>
      {footer && (
        <Text className="text-[13px] font-normal text-label-secondary dark:text-label-dark-secondary px-4 mt-1.5">
          {footer}
        </Text>
      )}
    </View>
  );
}

interface IOSRowProps {
  children: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  subtitle?: string;
  onPress?: () => void;
  selected?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
  disabled?: boolean;
  isLast?: boolean;
}

export function IOSRow({
  children,
  leading,
  trailing,
  subtitle,
  onPress,
  selected = false,
  destructive = false,
  showChevron = false,
  disabled = false,
  isLast = false,
}: IOSRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;
  const checkColor = BRAND_COLORS.primary;

  return (
    <>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        className={`flex-row items-center px-4 py-3 min-h-[44px] ${
          disabled ? "opacity-50" : "active:opacity-70"
        }`}
      >
        {leading && <View className="mr-3">{leading}</View>}

        <View className="flex-1">
          <Text
            className={`text-[17px] ${
              destructive
                ? "text-ios-red"
                : "text-label-primary dark:text-label-dark-primary"
            }`}
          >
            {children}
          </Text>
          {subtitle && (
            <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>

        {trailing && <View className="ml-2">{trailing}</View>}

        {selected && (
          <Check size={20} color={checkColor} strokeWidth={3} />
        )}

        {showChevron && !selected && (
          <ChevronRight size={20} color={chevronColor} strokeWidth={2} />
        )}
      </Pressable>
      {!isLast && <Separator inset={!!leading} />}
    </>
  );
}

interface IOSSectionHeaderProps {
  children: string;
}

export function IOSSectionHeader({ children }: IOSSectionHeaderProps) {
  return (
    <Text className="text-[22px] font-bold text-label-primary dark:text-label-dark-primary px-4 mb-2">
      {children}
    </Text>
  );
}
