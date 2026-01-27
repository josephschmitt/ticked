import { View, Text, Pressable, useColorScheme } from "react-native";
import { ChevronRight } from "lucide-react-native";
import type { DatabaseProperty } from "@/types/database";
import type { AppField } from "@/types/fieldMapping";
import { APP_FIELD_CONFIG } from "@/types/fieldMapping";
import { BRAND_COLORS, IOS_GRAYS } from "@/constants/colors";
import { useMacSizing } from "@/hooks/useMacSizing";

interface FieldMappingRowProps {
  appField: AppField;
  selectedProperty: DatabaseProperty | null;
  availableProperties: DatabaseProperty[];
  onPress: () => void;
  isLast?: boolean;
}

export function FieldMappingRow({
  appField,
  selectedProperty,
  availableProperties,
  onPress,
  isLast = false,
}: FieldMappingRowProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { fontSize, spacing, minHeight, iconSize } = useMacSizing();

  const config = APP_FIELD_CONFIG[appField];
  const hasValidOptions = availableProperties.length > 0;
  const chevronColor = isDark ? IOS_GRAYS.gray3 : IOS_GRAYS.gray3;

  return (
    <>
      <Pressable
        onPress={hasValidOptions ? onPress : undefined}
        disabled={!hasValidOptions}
        className={`flex-row items-center ${
          hasValidOptions ? "active:opacity-70" : "opacity-50"
        }`}
        style={{
          paddingHorizontal: spacing.rowPaddingHorizontal,
          paddingVertical: spacing.rowPaddingVertical,
          minHeight: minHeight.row,
        }}
      >
        <View className="flex-1 mr-3">
          <View className="flex-row items-center">
            <Text
              className="text-label-primary dark:text-label-dark-primary"
              style={{ fontSize: fontSize.body }}
            >
              {config.label}
            </Text>
            {config.required && (
              <Text className="text-ios-red ml-1">*</Text>
            )}
          </View>
          <Text
            className="text-label-secondary dark:text-label-dark-secondary mt-0.5"
            style={{ fontSize: fontSize.secondary }}
          >
            {config.description}
          </Text>
        </View>

        <View className="flex-row items-center">
          {selectedProperty ? (
            <Text
              className="mr-2"
              style={{ fontSize: fontSize.secondary, color: BRAND_COLORS.primary }}
            >
              {selectedProperty.name}
            </Text>
          ) : hasValidOptions ? (
            <Text
              className="text-label-tertiary dark:text-label-dark-tertiary mr-2"
              style={{ fontSize: fontSize.secondary }}
            >
              Select...
            </Text>
          ) : (
            <Text
              className="text-label-tertiary dark:text-label-dark-tertiary mr-2"
              style={{ fontSize: fontSize.caption }}
            >
              No matching
            </Text>
          )}
          {hasValidOptions && (
            <ChevronRight size={iconSize.medium} color={chevronColor} strokeWidth={2} />
          )}
        </View>
      </Pressable>

      {/* Separator */}
      {!isLast && (
        <View className="h-[0.5px] bg-separator dark:bg-separator-dark ml-4" />
      )}
    </>
  );
}
