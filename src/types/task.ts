export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  taskType?: string;
  project?: string;
  doDate?: string;
  dueDate?: string;
  url?: string;
  creationDate?: string;
  completedDate?: string;
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

export interface DateTaskGroup {
  label: string;
  date: string; // ISO date string for sorting
  tasks: Task[];
}
