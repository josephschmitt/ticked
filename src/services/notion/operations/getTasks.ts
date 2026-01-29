import { getNotionClient } from "../client";
import type { Task, TaskStatus, StatusGroup } from "@/types/task";
import type { FieldMapping } from "@/types/fieldMapping";
import type { DatabaseIcon } from "@/types/database";

interface PageResult {
  id: string;
  url: string;
  created_time: string;
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
  created_time?: string;
}

interface QueryResponse {
  results: PageResult[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface PaginatedTasksResult {
  tasks: Task[];
  hasMore: boolean;
  nextCursor: string | null;
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

interface RelationResult {
  name: string;
  icon: DatabaseIcon | null;
}

/**
 * Filter type for task queries.
 * - 'active': Only non-completed tasks
 * - 'completed': Only completed tasks
 * - 'all': All tasks (no filter)
 */
export type TaskFilterType = 'active' | 'completed' | 'all';

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
 * Fetches status property info from database schema.
 * Returns property name, type, and complete status names needed for filtering.
 * NOTE: Notion API filter uses status NAMES, not IDs.
 */
async function getStatusPropertyInfo(
  dataSourceId: string,
  statusPropertyId: string
): Promise<{
  name: string;
  type: 'status' | 'checkbox';
  completeStatusNames: string[];
} | null> {
  const client = getNotionClient();

  console.log('[getStatusPropertyInfo] Looking for status property:', statusPropertyId);

  const dataSource = (await client.dataSources.retrieve({
    data_source_id: dataSourceId,
  })) as unknown as {
    properties: Record<string, {
      id: string;
      type: string;
      status?: {
        options: Array<{ id: string; name: string; color: string }>;
      };
    }>;
  };

  // Find the status property by ID and get its name
  for (const [propName, prop] of Object.entries(dataSource.properties)) {
    console.log('[getStatusPropertyInfo] Checking property:', propName, 'id:', prop.id, 'type:', prop.type);
    if (prop.id === statusPropertyId) {
      console.log('[getStatusPropertyInfo] Found matching property:', propName);
      if (prop.type === 'checkbox') {
        console.log('[getStatusPropertyInfo] Property is checkbox type');
        return {
          name: propName,
          type: 'checkbox',
          completeStatusNames: ['checked'], // Not used for checkbox, but keeps type consistent
        };
      }

      if (prop.type === 'status' && prop.status) {
        // Find which status options are "complete"
        // NOTE: Notion API filter uses status NAME, not ID
        const completeStatusNames: string[] = [];
        for (const opt of prop.status.options) {
          const group = inferStatusGroup(opt.name);
          console.log('[getStatusPropertyInfo] Status option:', opt.name, 'id:', opt.id, 'inferred group:', group);
          if (group === 'complete') {
            completeStatusNames.push(opt.name);
          }
        }
        console.log('[getStatusPropertyInfo] Complete status names:', completeStatusNames);
        return {
          name: propName,
          type: 'status',
          completeStatusNames,
        };
      }
    }
  }
  console.log('[getStatusPropertyInfo] No matching property found!');
  return null;
}

/**
 * Builds a Notion API filter for status-based filtering.
 */
function buildStatusFilter(
  propertyName: string,
  propertyType: 'status' | 'checkbox',
  filterType: TaskFilterType,
  completeStatusNames: string[]
): Record<string, unknown> | undefined {
  console.log('[buildStatusFilter] Building filter:', { propertyName, propertyType, filterType, completeStatusNames });

  if (filterType === 'all') return undefined;

  if (propertyType === 'checkbox') {
    const filter = {
      property: propertyName,
      checkbox: { equals: filterType === 'completed' }
    };
    console.log('[buildStatusFilter] Checkbox filter:', JSON.stringify(filter));
    return filter;
  }

  // For status property type - use status NAMES in the filter
  if (completeStatusNames.length === 0) {
    console.log('[buildStatusFilter] No complete status names, returning undefined');
    return undefined;
  }

  let filter: Record<string, unknown>;

  if (filterType === 'active') {
    // Exclude completed statuses
    if (completeStatusNames.length === 1) {
      filter = {
        property: propertyName,
        status: { does_not_equal: completeStatusNames[0] }
      };
    } else {
      // Multiple complete statuses - need AND filter
      filter = {
        and: completeStatusNames.map(name => ({
          property: propertyName,
          status: { does_not_equal: name }
        }))
      };
    }
  } else {
    // Include only completed statuses
    if (completeStatusNames.length === 1) {
      filter = {
        property: propertyName,
        status: { equals: completeStatusNames[0] }
      };
    } else {
      // Multiple complete statuses - need OR filter
      filter = {
        or: completeStatusNames.map(name => ({
          property: propertyName,
          status: { equals: name }
        }))
      };
    }
  }

  console.log('[buildStatusFilter] Status filter:', JSON.stringify(filter));
  return filter;
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
 * Get a relation value, resolving the ID to title and icon if available.
 */
function getRelationValue(
  property: PropertyValue | undefined,
  relationInfos: Map<string, PageInfo>
): RelationResult | null {
  if (!property || property.type !== "relation" || !property.relation?.[0]) {
    return null;
  }
  const relationId = property.relation[0].id;
  const info = relationInfos.get(relationId);
  return info ? { name: info.title, icon: info.icon } : null;
}

/**
 * Convert a Notion page to a Task using field mapping.
 */
function pageToTask(
  page: PageResult,
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
    // No valid status property
    return null;
  }

  // Get optional fields - handle both select and relation types
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

  // Get creation date - can be from created_time property or date property
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
 * Fetch the title and icon of a page by ID.
 */
async function getPageInfo(pageId: string): Promise<PageInfo | null> {
  const client = getNotionClient();

  try {
    const page = (await client.pages.retrieve({
      page_id: pageId,
    })) as unknown as PageTitleResponse;

    // Find the title property (it's always type "title")
    let title: string | null = null;
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "title" && prop.title) {
        title = prop.title.map((t) => t.plain_text).join("") || null;
        break;
      }
    }

    if (!title) return null;

    // Transform icon to DatabaseIcon format
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
    console.warn(`Failed to fetch page info for ${pageId}`);
    return null;
  }
}

/**
 * Batch fetch page info (title and icon) for multiple IDs.
 */
async function getPageInfos(pageIds: string[]): Promise<Map<string, PageInfo>> {
  const infos = new Map<string, PageInfo>();

  // Fetch in parallel with a reasonable batch size
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
 * Fetch tasks from a Notion data source using field mapping.
 * Note: As of Notion API 2025-09-03, databases are now called "data sources".
 *
 * @param filterType - 'active' for non-completed tasks, 'completed' for done tasks, 'all' for everything
 */
export async function getTasks(
  dataSourceId: string,
  fieldMapping: FieldMapping,
  filterType: TaskFilterType = 'all'
): Promise<Task[]> {
  const client = getNotionClient();

  // Build filter if needed
  let filter: Record<string, unknown> | undefined = undefined;
  if (filterType !== 'all') {
    const statusInfo = await getStatusPropertyInfo(dataSourceId, fieldMapping.status);
    if (statusInfo) {
      filter = buildStatusFilter(
        statusInfo.name,
        statusInfo.type,
        filterType,
        statusInfo.completeStatusNames
      );
    }
  }

  // Fetch ALL pages, not just the first 100
  const allResults: PageResult[] = [];
  let hasMore = true;
  let cursor: string | null = null;

  while (hasMore) {
    const queryArgs: any = {
      data_source_id: dataSourceId,
      page_size: 100,
      // No sorting - maintain Notion's manual order
    };

    if (filter) {
      queryArgs.filter = filter;
    }

    if (cursor) {
      queryArgs.start_cursor = cursor;
    }

    const response = (await (client as unknown as {
      dataSources: {
        query: (args: typeof queryArgs) => Promise<QueryResponse>;
      };
    }).dataSources.query(queryArgs)) as QueryResponse;

    allResults.push(...response.results);
    hasMore = response.has_more;
    cursor = response.next_cursor;
  }

  // First pass: collect all relation IDs we need to resolve
  const relationIds = new Set<string>();
  const relationPropertyIds = [fieldMapping.taskType, fieldMapping.project].filter(Boolean) as string[];

  for (const page of allResults) {
    for (const prop of Object.values(page.properties)) {
      if (prop.type === "relation" && prop.relation && relationPropertyIds.includes(prop.id || "")) {
        for (const rel of prop.relation) {
          relationIds.add(rel.id);
        }
      }
    }
  }

  // Fetch info for all related pages
  const relationInfos = relationIds.size > 0
    ? await getPageInfos(Array.from(relationIds))
    : new Map<string, PageInfo>();

  // Second pass: build tasks with resolved relation info
  const tasks: Task[] = [];

  for (const page of allResults) {
    // Build property map by ID for quick lookup
    const propertyMap = new Map<string, PropertyValue>();
    for (const [_name, prop] of Object.entries(page.properties)) {
      // Map by property ID
      if (prop.id) {
        propertyMap.set(prop.id, prop);
      }
    }

    const task = pageToTask(page, fieldMapping, propertyMap, relationInfos);
    if (task) {
      tasks.push(task);
    }
  }

  return tasks;
}

/**
 * Fetch tasks with pagination support.
 *
 * @param filterType - 'active' for non-completed tasks, 'completed' for done tasks, 'all' for everything
 */
export async function getTasksPaginated(
  dataSourceId: string,
  fieldMapping: FieldMapping,
  cursor?: string | null,
  pageSize: number = 50,
  filterType: TaskFilterType = 'all'
): Promise<PaginatedTasksResult> {
  const client = getNotionClient();

  // Build filter if needed
  let filter: Record<string, unknown> | undefined = undefined;
  if (filterType !== 'all') {
    const statusInfo = await getStatusPropertyInfo(dataSourceId, fieldMapping.status);
    if (statusInfo) {
      filter = buildStatusFilter(
        statusInfo.name,
        statusInfo.type,
        filterType,
        statusInfo.completeStatusNames
      );
    }
  }

  // Build query args
  const queryArgs: {
    data_source_id: string;
    page_size: number;
    start_cursor?: string;
    filter?: Record<string, unknown>;
  } = {
    data_source_id: dataSourceId,
    page_size: pageSize,
    // No sorting - maintain Notion's manual order within groups
  };

  if (filter) {
    queryArgs.filter = filter;
  }

  if (cursor) {
    queryArgs.start_cursor = cursor;
  }

  const response = (await (client as unknown as {
    dataSources: {
      query: (args: typeof queryArgs) => Promise<QueryResponse>;
    };
  }).dataSources.query(queryArgs)) as QueryResponse;

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

  // Fetch info for all related pages
  const relationInfos = relationIds.size > 0
    ? await getPageInfos(Array.from(relationIds))
    : new Map<string, PageInfo>();

  // Second pass: build tasks with resolved relation info
  const tasks: Task[] = [];

  for (const page of response.results) {
    const propertyMap = new Map<string, PropertyValue>();
    for (const [_name, prop] of Object.entries(page.properties)) {
      if (prop.id) {
        propertyMap.set(prop.id, prop);
      }
    }

    const task = pageToTask(page, fieldMapping, propertyMap, relationInfos);
    if (task) {
      tasks.push(task);
    }
  }

  return {
    tasks,
    hasMore: response.has_more,
    nextCursor: response.next_cursor,
  };
}

/**
 * Fetch a single task by ID.
 * Used as a fallback when the task isn't in the cache.
 */
export async function getTaskById(
  taskId: string,
  fieldMapping: FieldMapping
): Promise<Task | null> {
  const client = getNotionClient();

  try {
    const page = (await client.pages.retrieve({
      page_id: taskId,
    })) as unknown as PageResult & {
      url: string;
      created_time: string;
      last_edited_time: string;
    };

    // Build property map by ID
    const propertyMap = new Map<string, PropertyValue>();
    for (const [_name, prop] of Object.entries(page.properties)) {
      if (prop.id) {
        propertyMap.set(prop.id, prop);
      }
    }

    // Collect relation IDs we need to resolve
    const relationIds = new Set<string>();
    const relationPropertyIds = [fieldMapping.taskType, fieldMapping.project].filter(Boolean) as string[];

    for (const prop of Object.values(page.properties)) {
      if (prop.type === "relation" && prop.relation && relationPropertyIds.includes(prop.id || "")) {
        for (const rel of prop.relation) {
          relationIds.add(rel.id);
        }
      }
    }

    // Fetch info for related pages
    const relationInfos = relationIds.size > 0
      ? await getPageInfos(Array.from(relationIds))
      : new Map<string, PageInfo>();

    return pageToTask(page, fieldMapping, propertyMap, relationInfos);
  } catch (error) {
    console.error(`Failed to fetch task ${taskId}:`, error);
    return null;
  }
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
