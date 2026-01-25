import { getNotionClient } from "../client";
import type { Task, TaskStatus, StatusGroup } from "@/types/task";
import type { FieldMapping } from "@/types/fieldMapping";

interface PageResult {
  id: string;
  url: string;
  last_edited_time: string;
  properties: Record<string, PropertyValue>;
}

interface PropertyValue {
  id?: string;
  type: string;
  title?: Array<{ plain_text: string }>;
  rich_text?: Array<{ plain_text: string }>;
  select?: { id: string; name: string; color: string } | null;
  status?: { id: string; name: string; color: string } | null;
  checkbox?: boolean;
  date?: { start: string; end: string | null } | null;
  url?: string | null;
  relation?: Array<{ id: string }>;
}

interface QueryResponse {
  results: PageResult[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Infer status group from status name.
 */
function inferStatusGroup(statusName: string): StatusGroup {
  const normalized = statusName.toLowerCase();

  if (
    normalized.includes("done") ||
    normalized.includes("complete") ||
    normalized.includes("finished")
  ) {
    return "complete";
  }

  if (
    normalized.includes("progress") ||
    normalized.includes("doing") ||
    normalized.includes("started")
  ) {
    return "inProgress";
  }

  return "todo";
}

/**
 * Extract property value based on type.
 */
function extractPropertyValue(
  property: PropertyValue | undefined,
  type: "title" | "text" | "select" | "status" | "checkbox" | "date" | "url" | "relation"
): string | boolean | null {
  if (!property) return null;

  switch (type) {
    case "title":
      return property.title?.map((t) => t.plain_text).join("") || null;
    case "text":
      return property.rich_text?.map((t) => t.plain_text).join("") || null;
    case "select":
      return property.select?.name || null;
    case "status":
      return property.status?.name || null;
    case "checkbox":
      return property.checkbox ?? false;
    case "date":
      return property.date?.start || null;
    case "url":
      return property.url || null;
    case "relation":
      return property.relation?.[0]?.id || null;
    default:
      return null;
  }
}

/**
 * Convert a Notion page to a Task using field mapping.
 */
function pageToTask(
  page: PageResult,
  fieldMapping: FieldMapping,
  propertyMap: Map<string, PropertyValue>
): Task | null {
  // Get title (required)
  const titleProp = propertyMap.get(fieldMapping.taskName);
  const title = extractPropertyValue(titleProp, "title") as string | null;
  if (!title) return null;

  // Get status (required)
  const statusProp = propertyMap.get(fieldMapping.status);
  let status: TaskStatus;

  if (statusProp?.type === "status" && statusProp.status) {
    status = {
      id: statusProp.status.id,
      name: statusProp.status.name,
      color: statusProp.status.color,
      group: inferStatusGroup(statusProp.status.name),
    };
  } else if (statusProp?.type === "checkbox") {
    const isChecked = statusProp.checkbox ?? false;
    status = {
      id: isChecked ? "checked" : "unchecked",
      name: isChecked ? "Complete" : "To Do",
      color: isChecked ? "green" : "default",
      group: isChecked ? "complete" : "todo",
    };
  } else {
    // No valid status property
    return null;
  }

  // Get optional fields
  const taskType = fieldMapping.taskType
    ? (extractPropertyValue(
        propertyMap.get(fieldMapping.taskType),
        propertyMap.get(fieldMapping.taskType)?.type === "relation" ? "relation" : "select"
      ) as string | null)
    : undefined;

  const project = fieldMapping.project
    ? (extractPropertyValue(
        propertyMap.get(fieldMapping.project),
        propertyMap.get(fieldMapping.project)?.type === "relation" ? "relation" : "select"
      ) as string | null)
    : undefined;

  const doDate = fieldMapping.doDate
    ? (extractPropertyValue(propertyMap.get(fieldMapping.doDate), "date") as string | null)
    : undefined;

  const dueDate = fieldMapping.dueDate
    ? (extractPropertyValue(propertyMap.get(fieldMapping.dueDate), "date") as string | null)
    : undefined;

  const url = fieldMapping.url
    ? (extractPropertyValue(propertyMap.get(fieldMapping.url), "url") as string | null)
    : undefined;

  return {
    id: page.id,
    title,
    status,
    taskType: taskType || undefined,
    project: project || undefined,
    doDate: doDate || undefined,
    dueDate: dueDate || undefined,
    url: url || undefined,
    notionUrl: page.url,
    lastEditedTime: page.last_edited_time,
  };
}

/**
 * Fetch tasks from a Notion database using field mapping.
 */
export async function getTasks(
  databaseId: string,
  fieldMapping: FieldMapping
): Promise<Task[]> {
  const client = getNotionClient();

  // Use the pages API to query the database
  const response = (await (client as unknown as {
    databases: {
      query: (args: { database_id: string; page_size?: number; sorts?: Array<{ timestamp: string; direction: string }> }) => Promise<QueryResponse>;
    };
  }).databases.query({
    database_id: databaseId,
    page_size: 100,
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  })) as QueryResponse;

  const tasks: Task[] = [];

  for (const page of response.results) {
    // Build property map by ID for quick lookup
    const propertyMap = new Map<string, PropertyValue>();
    for (const [_name, prop] of Object.entries(page.properties)) {
      // Map by property ID
      if (prop.id) {
        propertyMap.set(prop.id, prop);
      }
    }

    const task = pageToTask(page, fieldMapping, propertyMap);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get unique status values from a database.
 */
export async function getStatuses(
  databaseId: string,
  statusPropertyId: string
): Promise<TaskStatus[]> {
  const client = getNotionClient();

  const database = (await client.databases.retrieve({
    database_id: databaseId,
  })) as unknown as {
    properties: Record<
      string,
      {
        id: string;
        type: string;
        status?: {
          options: Array<{ id: string; name: string; color: string }>;
          groups: Array<{ id: string; name: string; option_ids: string[] }>;
        };
      }
    >;
  };

  // Find the status property
  const statusProp = Object.values(database.properties).find(
    (prop) => prop.id === statusPropertyId
  );

  if (!statusProp || statusProp.type !== "status" || !statusProp.status) {
    // For checkbox, return simple complete/incomplete
    return [
      { id: "unchecked", name: "To Do", color: "default", group: "todo" },
      { id: "checked", name: "Complete", color: "green", group: "complete" },
    ];
  }

  // Map status groups from Notion
  const groupMap = new Map<string, string>();
  for (const group of statusProp.status.groups) {
    for (const optionId of group.option_ids) {
      groupMap.set(optionId, group.name);
    }
  }

  return statusProp.status.options.map((opt) => ({
    id: opt.id,
    name: opt.name,
    color: opt.color,
    group: inferStatusGroup(groupMap.get(opt.id) || opt.name),
  }));
}
