import { useState, useCallback } from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import type { DateTaskGroup as DateTaskGroupType } from "@/types/task";
import { TaskRow } from "./TaskRow";
import { Separator } from "@/components/ui/Separator";
import { IOS_GRAYS } from "@/constants/colors";

interface DateTaskGroupProps {
  group: DateTaskGroupType;
  defaultExpanded?: boolean;
}

export function DateTaskGroup({ group, defaultExpanded = true }: DateTaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
    Haptics.selectionAsync();
  }, []);

  const taskCount = group.tasks.length;
  const chevronColor = isDark ? IOS_GRAYS.gray2 : IOS_GRAYS.system;

  return (
    <View className="mb-6">
      {/* Section header */}
      <Pressable
        onPress={toggleExpanded}
        className="flex-row items-center justify-between px-4 pb-2"
        accessibilityRole="button"
        accessibilityLabel={`${group.label}, ${taskCount} tasks, ${isExpanded ? "expanded" : "collapsed"}`}
        accessibilityHint="Double tap to toggle section"
      >
        <Text className="text-[22px] font-bold text-label-primary dark:text-label-dark-primary">
          {group.label}{" "}
          <Text className="font-normal text-label-secondary dark:text-label-dark-secondary">
            {taskCount}
          </Text>
        </Text>

        {isExpanded ? (
          <ChevronDown size={22} color={chevronColor} strokeWidth={2.5} />
        ) : (
          <ChevronRight size={22} color={chevronColor} strokeWidth={2.5} />
        )}
      </Pressable>

      {/* Grouped container */}
      {isExpanded && (
        <View className="mx-4 rounded-[10px] bg-background-elevated dark:bg-background-dark-elevated overflow-hidden">
          {group.tasks.map((task, index) => (
            <View key={task.id}>
              <TaskRow task={task} />
              {index < group.tasks.length - 1 && <Separator />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
