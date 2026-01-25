import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
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

const FIELD_ORDER: AppField[] = [
  "taskName",
  "status",
  "taskType",
  "project",
  "doDate",
  "dueDate",
  "url",
];

export default function FieldMappingScreen() {
  const router = useRouter();
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
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Loading database schema...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !schema) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 dark:text-red-400 text-lg text-center mb-4">
            Failed to load database schema
          </Text>
          {error && (
            <Text className="text-gray-500 dark:text-gray-400 text-center text-sm mb-4">
              {error instanceof Error ? error.message : "Unknown error"}
            </Text>
          )}
          <Pressable
            onPress={() => router.back()}
            className="bg-primary-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-black" edges={["bottom"]}>
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
      >
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Configure how properties in "{databaseName}" map to the app's fields.
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Fields marked with <Text className="text-red-500">*</Text> are required.
        </Text>

        {FIELD_ORDER.map((field) => (
          <FieldMappingRow
            key={field}
            appField={field}
            selectedProperty={getSelectedProperty(field)}
            availableProperties={propertiesByField[field] || []}
            onPress={() => openPicker(field)}
          />
        ))}
      </ScrollView>

      {/* Continue button */}
      <View className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <Pressable
          onPress={handleContinue}
          disabled={!canContinue}
          className={`
            py-4 rounded-xl items-center
            ${canContinue ? "bg-primary-600 active:bg-primary-700" : "bg-gray-300 dark:bg-gray-700"}
          `}
        >
          <Text
            className={`text-lg font-semibold ${
              canContinue ? "text-white" : "text-gray-500 dark:text-gray-400"
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
