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

interface PageTitleResponse {
  id: string;
  properties: Record<string, { type: string; title?: Array<{ plain_text: string }> }>;
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
 * Get a relation value, resolving the ID to a title if available.
 */
function getRelationValue(
  property: PropertyValue | undefined,
  relationTitles: Map<string, string>
): string | null {
  if (!property || property.type !== "relation" || !property.relation?.[0]) {
    return null;
  }
  const relationId = property.relation[0].id;
  return relationTitles.get(relationId) || null;
}

/**
 * Convert a Notion page to a Task using field mapping.
 */
function pageToTask(
  page: PageResult,
  fieldMapping: FieldMapping,
  propertyMap: Map<string, PropertyValue>,
  relationTitles: Map<string, string>
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

  // Get optional fields - handle both select and relation types
  const taskTypeProp = fieldMapping.taskType ? propertyMap.get(fieldMapping.taskType) : undefined;
  const taskType = taskTypeProp
    ? taskTypeProp.type === "relation"
      ? getRelationValue(taskTypeProp, relationTitles)
      : (extractPropertyValue(taskTypeProp, "select") as string | null)
    : undefined;

  const projectProp = fieldMapping.project ? propertyMap.get(fieldMapping.project) : undefined;
  const project = projectProp
    ? projectProp.type === "relation"
      ? getRelationValue(projectProp, relationTitles)
      : (extractPropertyValue(projectProp, "select") as string | null)
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
 * Fetch the title of a page by ID.
 */
async function getPageTitle(pageId: string): Promise<string | null> {
  const client = getNotionClient();

  try {
    const page = (await client.pages.retrieve({
      page_id: pageId,
    })) as unknown as PageTitleResponse;

    // Find the title property (it's always type "title")
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "title" && prop.title) {
        return prop.title.map((t) => t.plain_text).join("") || null;
      }
    }
    return null;
  } catch {
    console.warn(`Failed to fetch page title for ${pageId}`);
    return null;
  }
}

/**
 * Batch fetch page titles for multiple IDs.
 */
async function getPageTitles(pageIds: string[]): Promise<Map<string, string>> {
  const titles = new Map<string, string>();

  // Fetch in parallel with a reasonable batch size
  const results = await Promise.all(
    pageIds.map(async (id) => {
      const title = await getPageTitle(id);
      return { id, title };
    })
  );

  for (const { id, title } of results) {
    if (title) {
      titles.set(id, title);
    }
  }

  return titles;
}

/**
 * Fetch tasks from a Notion data source using field mapping.
 * Note: As of Notion API 2025-09-03, databases are now called "data sources".
 */
export async function getTasks(
  dataSourceId: string,
  fieldMapping: FieldMapping
): Promise<Task[]> {
  const client = getNotionClient();

  // Use the data sources API to query pages
  const response = (await (client as unknown as {
    dataSources: {
      query: (args: { data_source_id: string; page_size?: number; sorts?: Array<{ timestamp: string; direction: string }> }) => Promise<QueryResponse>;
    };
  }).dataSources.query({
    data_source_id: dataSourceId,
    page_size: 100,
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  })) as QueryResponse;

  // First pass: collect all relation IDs we need to resolve
  const relationIds = new Set<string>();
  const relationPropertyIds = [fieldMapping.taskType, fieldMapping.project].filter(Boolean) as string[];

  for (const page of response.results) {
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "relation" && prop.relation && relationPropertyIds.includes(prop.id || "")) {
        for (const rel of prop.relation) {
          relationIds.add(rel.id);
        }
      }
    }
  }

  // Fetch titles for all related pages
  const relationTitles = relationIds.size > 0
    ? await getPageTitles(Array.from(relationIds))
    : new Map<string, string>();

  // Second pass: build tasks with resolved relation titles
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

    const task = pageToTask(page, fieldMapping, propertyMap, relationTitles);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Get unique status values from a data source.
 * Note: As of Notion API 2025-09-03, databases are now called "data sources".
 */
export async function getStatuses(
  dataSourceId: string,
  statusPropertyId: string
): Promise<TaskStatus[]> {
  const client = getNotionClient();

  const dataSource = (await client.dataSources.retrieve({
    data_source_id: dataSourceId,
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
  const statusProp = Object.values(dataSource.properties).find(
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
