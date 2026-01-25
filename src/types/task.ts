export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  taskType?: string;
  project?: string;
  doDate?: string;
  dueDate?: string;
  url?: string;
  // Notion metadata
  notionUrl: string;
  lastEditedTime: string;
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  group: StatusGroup;
}

export type StatusGroup = "todo" | "inProgress" | "complete";

// Maps Notion status group names to our internal groups
export const STATUS_GROUP_MAP: Record<string, StatusGroup> = {
  "To-do": "todo",
  "To Do": "todo",
  "Not started": "todo",
  "In progress": "inProgress",
  "In Progress": "inProgress",
  "Done": "complete",
  "Complete": "complete",
  "Completed": "complete",
};

export interface TaskGroup {
  status: TaskStatus;
  tasks: Task[];
}

// Status color mapping from Notion colors to Tailwind classes
export const STATUS_COLORS: Record<string, string> = {
  default: "bg-gray-100 dark:bg-gray-800",
  gray: "bg-gray-100 dark:bg-gray-800",
  brown: "bg-amber-100 dark:bg-amber-900",
  orange: "bg-orange-100 dark:bg-orange-900",
  yellow: "bg-yellow-100 dark:bg-yellow-900",
  green: "bg-green-100 dark:bg-green-900",
  blue: "bg-blue-100 dark:bg-blue-900",
  purple: "bg-purple-100 dark:bg-purple-900",
  pink: "bg-pink-100 dark:bg-pink-900",
  red: "bg-red-100 dark:bg-red-900",
};
