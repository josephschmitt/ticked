import { getNotionClient } from "@/services/notion/client";
import type { Task, TaskStatus, StatusGroup } from "@/types/task";
import type { FieldMapping } from "@/types/fieldMapping";
import type { DatabaseIcon } from "@/types/database";

/**
 * Search results from Notion API
 */
interface SearchResult {
  id: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  parent: {
    type: string;
    database_id?: string;
  };
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
  created_time?: string;
}

interface SearchResponse {
  results: SearchResult[];
  has_more: boolean;
  next_cursor: string | null;
}

interface PageTitleResponse {
  id: string;
  icon: {
    type: "emoji" | "external" | "file";
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  } | null;
  properties: Record<string, { type: string; title?: Array<{ plain_text: string }> }>;
}

interface PageInfo {
  title: string;
  icon: DatabaseIcon | null;
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
  type: "title" | "text" | "select" | "status" | "checkbox" | "date" | "url" | "relation" | "created_time"
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
    case "created_time":
      return property.created_time || null;
    default:
      return null;
  }
}

/**
 * Fetch the title and icon of a page by ID.
 */
async function getPageInfo(pageId: string): Promise<PageInfo | null> {
  const client = getNotionClient();

  try {
    const page = (await client.pages.retrieve({
      page_id: pageId,
    })) as unknown as PageTitleResponse;

    let title: string | null = null;
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "title" && prop.title) {
        title = prop.title.map((t) => t.plain_text).join("") || null;
        break;
      }
    }

    if (!title) return null;

    let icon: DatabaseIcon | null = null;
    if (page.icon) {
      if (page.icon.type === "emoji" && page.icon.emoji) {
        icon = { type: "emoji", emoji: page.icon.emoji };
      } else if (page.icon.type === "external" && page.icon.external) {
        icon = { type: "external", external: { url: page.icon.external.url } };
      } else if (page.icon.type === "file" && page.icon.file) {
        icon = { type: "file", file: { url: page.icon.file.url } };
      }
    }

    return { title, icon };
  } catch {
    return null;
  }
}

/**
 * Batch fetch page info for multiple IDs.
 */
async function getPageInfos(pageIds: string[]): Promise<Map<string, PageInfo>> {
  const infos = new Map<string, PageInfo>();
  const results = await Promise.all(
    pageIds.map(async (id) => {
      const info = await getPageInfo(id);
      return { id, info };
    })
  );

  for (const { id, info } of results) {
    if (info) {
      infos.set(id, info);
    }
  }

  return infos;
}

/**
 * Get a relation value with resolved title and icon.
 */
function getRelationValue(
  property: PropertyValue | undefined,
  relationInfos: Map<string, PageInfo>
): { name: string; icon: DatabaseIcon | null } | null {
  if (!property || property.type !== "relation" || !property.relation?.[0]) {
    return null;
  }
  const relationId = property.relation[0].id;
  const info = relationInfos.get(relationId);
  return info ? { name: info.title, icon: info.icon } : null;
}

/**
 * Convert a search result page to a Task.
 */
function searchResultToTask(
  page: SearchResult,
  fieldMapping: FieldMapping,
  propertyMap: Map<string, PropertyValue>,
  relationInfos: Map<string, PageInfo>
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
    return null;
  }

  // Get optional fields
  const taskTypeProp = fieldMapping.taskType ? propertyMap.get(fieldMapping.taskType) : undefined;
  let taskType: string | undefined;
  let taskTypeIcon: DatabaseIcon | null | undefined;
  if (taskTypeProp) {
    if (taskTypeProp.type === "relation") {
      const relationResult = getRelationValue(taskTypeProp, relationInfos);
      taskType = relationResult?.name;
      taskTypeIcon = relationResult?.icon;
    } else {
      taskType = extractPropertyValue(taskTypeProp, "select") as string | null ?? undefined;
    }
  }

  const projectProp = fieldMapping.project ? propertyMap.get(fieldMapping.project) : undefined;
  let project: string | undefined;
  let projectIcon: DatabaseIcon | null | undefined;
  if (projectProp) {
    if (projectProp.type === "relation") {
      const relationResult = getRelationValue(projectProp, relationInfos);
      project = relationResult?.name;
      projectIcon = relationResult?.icon;
    } else {
      project = extractPropertyValue(projectProp, "select") as string | null ?? undefined;
    }
  }

  const doDate = fieldMapping.doDate
    ? (extractPropertyValue(propertyMap.get(fieldMapping.doDate), "date") as string | null)
    : undefined;

  const dueDate = fieldMapping.dueDate
    ? (extractPropertyValue(propertyMap.get(fieldMapping.dueDate), "date") as string | null)
    : undefined;

  const url = fieldMapping.url
    ? (extractPropertyValue(propertyMap.get(fieldMapping.url), "url") as string | null)
    : undefined;

  let creationDate: string | null | undefined;
  if (fieldMapping.creationDate) {
    const creationProp = propertyMap.get(fieldMapping.creationDate);
    if (creationProp?.type === "created_time") {
      creationDate = extractPropertyValue(creationProp, "created_time") as string | null;
    } else {
      creationDate = extractPropertyValue(creationProp, "date") as string | null;
    }
  }

  const completedDate = fieldMapping.completedDate
    ? (extractPropertyValue(propertyMap.get(fieldMapping.completedDate), "date") as string | null)
    : undefined;

  return {
    id: page.id,
    title,
    status,
    taskType: taskType || undefined,
    taskTypeIcon: taskTypeIcon,
    project: project || undefined,
    projectIcon: projectIcon,
    doDate: doDate || undefined,
    dueDate: dueDate || undefined,
    url: url || undefined,
    creationDate: creationDate || undefined,
    completedDate: completedDate || undefined,
    notionUrl: page.url,
    lastEditedTime: page.last_edited_time,
  };
}

/**
 * Search tasks locally (in cached tasks) by title.
 * Performs case-insensitive matching and sorts by relevance:
 * 1. Exact match
 * 2. Starts with query
 * 3. Contains query
 */
export function searchTasksLocal(tasks: Task[], query: string): Task[] {
  if (!query || query.length < 2) return [];

  const normalizedQuery = query.toLowerCase().trim();

  // Score each task based on match type
  const scored = tasks
    .map((task) => {
      const normalizedTitle = task.title.toLowerCase();
      let score = 0;

      if (normalizedTitle === normalizedQuery) {
        score = 3; // Exact match
      } else if (normalizedTitle.startsWith(normalizedQuery)) {
        score = 2; // Starts with
      } else if (normalizedTitle.includes(normalizedQuery)) {
        score = 1; // Contains
      }

      return { task, score };
    })
    .filter(({ score }) => score > 0);

  // Sort by score (descending) then by title (ascending)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.task.title.localeCompare(b.task.title);
  });

  return scored.map(({ task }) => task);
}

/**
 * Search tasks online using Notion's search API.
 * Filters results to only include pages from the specified database.
 */
export async function searchTasksOnline(
  query: string,
  databaseId: string,
  fieldMapping: FieldMapping
): Promise<Task[]> {
  if (!query || query.length < 2) return [];

  const client = getNotionClient();

  // Use Notion's search API
  const response = (await client.search({
    query,
    filter: {
      property: "object",
      value: "page",
    },
    page_size: 100, // Fetch more since we filter by database
  })) as unknown as SearchResponse;

  // Filter to only pages from the configured database
  // Normalize database ID by removing hyphens for comparison
  const normalizedDbId = databaseId.replace(/-/g, "");
  const filteredResults = response.results.filter((page) => {
    if (page.parent.type !== "database_id" || !page.parent.database_id) {
      return false;
    }
    const pageDbId = page.parent.database_id.replace(/-/g, "");
    return pageDbId === normalizedDbId;
  });

  // Limit to 50 results
  const limitedResults = filteredResults.slice(0, 50);

  if (limitedResults.length === 0) return [];

  // Collect relation IDs for resolution
  const relationIds = new Set<string>();
  const relationPropertyIds = [fieldMapping.taskType, fieldMapping.project].filter(Boolean) as string[];

  for (const page of limitedResults) {
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "relation" && prop.relation && relationPropertyIds.includes(prop.id || "")) {
        for (const rel of prop.relation) {
          relationIds.add(rel.id);
        }
      }
    }
  }

  // Fetch info for related pages
  const relationInfos = relationIds.size > 0
    ? await getPageInfos(Array.from(relationIds))
    : new Map<string, PageInfo>();

  // Convert to tasks
  const tasks: Task[] = [];

  for (const page of limitedResults) {
    const propertyMap = new Map<string, PropertyValue>();
    for (const [_name, prop] of Object.entries(page.properties)) {
      if (prop.id) {
        propertyMap.set(prop.id, prop);
      }
    }

    const task = searchResultToTask(page, fieldMapping, propertyMap, relationInfos);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}
