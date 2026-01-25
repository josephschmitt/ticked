import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useDatabaseSchema } from "@/hooks/queries/useDatabaseSchema";
import { useConfigStore } from "@/stores/configStore";
import { FieldMappingRow } from "@/components/setup/FieldMappingRow";
import { PropertyPicker } from "@/components/setup/PropertyPicker";
import { filterPropertiesByType } from "@/services/notion/operations/getDatabaseSchema";
import type { FieldMapping, AppField } from "@/types/fieldMapping";
import { APP_FIELD_CONFIG } from "@/types/fieldMapping";
import type { DatabaseProperty } from "@/types/database";
import { BRAND_COLORS } from "@/constants/colors";

const FIELD_ORDER: AppField[] = [
  "taskName",
  "status",
  "taskType",
  "project",
  "doDate",
  "dueDate",
  "url",
  "creationDate",
  "completedDate",
];

export default function FieldMappingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const databaseId = useConfigStore((state) => state.selectedDatabaseId);
  const databaseName = useConfigStore((state) => state.selectedDatabaseName);
  const setFieldMapping = useConfigStore((state) => state.setFieldMapping);
  const existingMapping = useConfigStore((state) => state.fieldMapping);

  const { data: schema, isLoading, error } = useDatabaseSchema(databaseId);

  // State for current field mapping
  const [mapping, setMapping] = useState<Partial<FieldMapping>>(
    existingMapping || {}
  );

  // State for property picker modal
  const [pickerState, setPickerState] = useState<{
    visible: boolean;
    field: AppField | null;
  }>({ visible: false, field: null });

  // Group properties by allowed types for each field
  const propertiesByField = useMemo((): Partial<Record<AppField, DatabaseProperty[]>> => {
    if (!schema) return {};

    const result: Partial<Record<AppField, DatabaseProperty[]>> = {};

    for (const field of FIELD_ORDER) {
      const config = APP_FIELD_CONFIG[field];
      result[field] = filterPropertiesByType(
        schema.properties,
        config.allowedTypes
      );
    }

    return result;
  }, [schema]);

  // Get selected property for a field
  const getSelectedProperty = useCallback(
    (field: AppField): DatabaseProperty | null => {
      const propertyId = mapping[field];
      if (!propertyId || !schema) return null;
      return (
        schema.properties.find((p) => p.id === propertyId || p.name === propertyId) ||
        null
      );
    },
    [mapping, schema]
  );

  // Open property picker for a field
  const openPicker = useCallback((field: AppField) => {
    setPickerState({ visible: true, field });
    Haptics.selectionAsync();
  }, []);

  // Close picker
  const closePicker = useCallback(() => {
    setPickerState({ visible: false, field: null });
  }, []);

  // Handle property selection
  const handleSelectProperty = useCallback(
    (property: DatabaseProperty) => {
      if (!pickerState.field) return;

      setMapping((prev) => ({
        ...prev,
        [pickerState.field!]: property.id,
      }));
      Haptics.selectionAsync();
      closePicker();
    },
    [pickerState.field, closePicker]
  );

  // Handle clearing optional field
  const handleClearProperty = useCallback(() => {
    if (!pickerState.field) return;

    setMapping((prev) => {
      const next = { ...prev };
      delete next[pickerState.field!];
      return next;
    });
    Haptics.selectionAsync();
    closePicker();
  }, [pickerState.field, closePicker]);

  // Check if required fields are mapped
  const canContinue = useMemo(() => {
    return !!mapping.taskName && !!mapping.status;
  }, [mapping]);

  // Handle continue
  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setFieldMapping(mapping as FieldMapping);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace("/(main)");
  }, [canContinue, mapping, setFieldMapping, router]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
          <Text className="mt-4 text-label-secondary dark:text-label-dark-secondary">
            Loading database schema...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !schema) {
    return (
      <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-ios-red text-lg text-center mb-4">
            Failed to load database schema
          </Text>
          {error && (
            <Text className="text-label-secondary dark:text-label-dark-secondary text-center text-[15px] mb-4">
              {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          )}
          <Pressable
            onPress={() => router.back()}
            className="px-6 py-3 rounded-[10px]"
            style={{ backgroundColor: BRAND_COLORS.primary }}
          >
            <Text className="text-white font-semibold text-[17px]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-grouped dark:bg-background-dark-grouped" edges={["bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 24 }}
      >
        <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary px-4 mb-1">
          Configure how properties in "{databaseName}" map to the app's fields.
        </Text>
        <Text className="text-[15px] text-label-secondary dark:text-label-dark-secondary px-4 mb-4">
          Fields marked with <Text className="text-ios-red">*</Text> are required.
        </Text>

        <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
          {FIELD_ORDER.map((field, index) => (
            <FieldMappingRow
              key={field}
              appField={field}
              selectedProperty={getSelectedProperty(field)}
              availableProperties={propertiesByField[field] || []}
              onPress={() => openPicker(field)}
              isLast={index === FIELD_ORDER.length - 1}
            />
          ))}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View className="px-4 py-4 border-t border-separator dark:border-separator-dark bg-background-elevated dark:bg-background-dark-elevated">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className="py-4 rounded-[10px] items-center"
          style={{
            backgroundColor: canContinue ? BRAND_COLORS.primary : (isDark ? '#3A3A3C' : '#D1D1D6'),
          }}
        >
          <Text
            className={`text-[17px] font-semibold ${
              canContinue ? "text-white" : "text-label-tertiary dark:text-label-dark-tertiary"
            }`}
          >
            Start Using App
          </Text>
        </Pressable>
      </View>

      {/* Property picker modal */}
      {pickerState.field && (
        <PropertyPicker
          visible={pickerState.visible}
          title={APP_FIELD_CONFIG[pickerState.field].label}
          properties={propertiesByField[pickerState.field] || []}
          selectedId={mapping[pickerState.field] || null}
          onSelect={handleSelectProperty}
          onCancel={closePicker}
          onClear={
            APP_FIELD_CONFIG[pickerState.field].required
              ? undefined
              : handleClearProperty
          }
          required={APP_FIELD_CONFIG[pickerState.field].required}
        />
      )}
    </SafeAreaView>
  );
}
