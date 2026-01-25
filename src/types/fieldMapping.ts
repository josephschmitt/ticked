export interface FieldMapping {
  // Required fields
  taskName: string; // Title property ID
  status: string; // Status or Checkbox property ID

  // Optional fields
  taskType?: string; // Select or Relation property ID
  project?: string; // Select or Relation property ID
  doDate?: string; // Date property ID
  dueDate?: string; // Date property ID
  url?: string; // URL property ID
}

export interface PropertyInfo {
  id: string;
  name: string;
  type: string;
}

export interface DatabaseSchema {
  id: string;
  title: string;
  properties: PropertyInfo[];
}

export type AppField = keyof FieldMapping;

export const APP_FIELD_CONFIG: Record<
  AppField,
  {
    label: string;
    description: string;
    required: boolean;
    allowedTypes: string[];
  }
> = {
  taskName: {
    label: "Task Name",
    description: "The title of each task",
    required: true,
    allowedTypes: ["title"],
  },
  status: {
    label: "Status",
    description: "Todo, In Progress, Complete, etc.",
    required: true,
    allowedTypes: ["status", "checkbox"],
  },
  taskType: {
    label: "Task Type",
    description: "Category or type of task",
    required: false,
    allowedTypes: ["select", "relation"],
  },
  project: {
    label: "Project",
    description: "Associated project",
    required: false,
    allowedTypes: ["select", "relation"],
  },
  doDate: {
    label: "Do Date",
    description: "When to work on the task",
    required: false,
    allowedTypes: ["date"],
  },
  dueDate: {
    label: "Due Date",
    description: "When the task is due",
    required: false,
    allowedTypes: ["date"],
  },
  url: {
    label: "URL",
    description: "Related link",
    required: false,
    allowedTypes: ["url"],
  },
};
