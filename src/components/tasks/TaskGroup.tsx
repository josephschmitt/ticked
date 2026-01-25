import { useState, useCallback } from "react";
import { View, Text, Pressable, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import type { TaskGroup as TaskGroupType } from "@/types/task";
import { TaskRow } from "./TaskRow";
import { Separator } from "@/components/ui/Separator";
import { IOS_GRAYS } from "@/constants/colors";

interface TaskGroupProps {
  group: TaskGroupType;
  defaultExpanded?: boolean;
}

export function TaskGroup({ group, defaultExpanded = true }: TaskGroupProps) {
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
        className="flex-row items-center justify-between px-6 pb-2"
        accessibilityRole="button"
        accessibilityLabel={`${group.status.name}, ${taskCount} tasks, ${isExpanded ? "expanded" : "collapsed"}`}
        accessibilityHint="Double tap to toggle section"
      >
        <Text className="text-[22px] font-bold text-label-primary dark:text-label-dark-primary">
          {group.status.name}{" "}
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

      {/* Grouped container - edge to edge with larger radius */}
      {isExpanded && (
        <View className="mx-0 py-3 rounded-[32px] bg-background-elevated dark:bg-background-dark-elevated">
          {group.tasks.length === 0 ? (
            <View className="py-4 items-center">
              <Text className="text-label-tertiary dark:text-label-dark-tertiary text-[15px]">
                No tasks
              </Text>
            </View>
          ) : (
            group.tasks.map((task, index) => (
              <View key={task.id}>
                <TaskRow task={task} />
                {index < group.tasks.length - 1 && <Separator />}
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}
