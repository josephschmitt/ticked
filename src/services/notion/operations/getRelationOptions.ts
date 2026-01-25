import { getNotionClient } from "../client";
import type { DatabaseIcon } from "@/types/database";

export interface RelationOption {
  id: string;
  title: string;
  icon: DatabaseIcon | null;
}

interface PageResult {
  id: string;
  icon: {
    type: "emoji" | "external" | "file";
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  } | null;
  properties: Record<string, {
    type: string;
    title?: Array<{ plain_text: string }>;
  }>;
}

interface QueryResponse {
  results: PageResult[];
  has_more: boolean;
  next_cursor: string | null;
}

/**
 * Transform Notion icon to DatabaseIcon format.
 */
function transformIcon(notionIcon: PageResult["icon"]): DatabaseIcon | null {
  if (!notionIcon) return null;

  if (notionIcon.type === "emoji" && notionIcon.emoji) {
    return { type: "emoji", emoji: notionIcon.emoji };
  } else if (notionIcon.type === "external" && notionIcon.external) {
    return { type: "external", external: { url: notionIcon.external.url } };
  } else if (notionIcon.type === "file" && notionIcon.file) {
    return { type: "file", file: { url: notionIcon.file.url } };
  }

  return null;
}

/**
 * Get page title from properties.
 */
function getPageTitle(properties: PageResult["properties"]): string | null {
  for (const prop of Object.values(properties)) {
    if (prop.type === "title" && prop.title) {
      return prop.title.map((t) => t.plain_text).join("") || null;
    }
  }
  return null;
}

/**
 * Fetch options from a relation's target database.
 * Returns pages from the target database with their titles and icons.
 */
export async function getRelationOptions(
  targetDatabaseId: string,
  limit: number = 100
): Promise<RelationOption[]> {
  const client = getNotionClient();

  const response = (await (client as unknown as {
    dataSources: {
      query: (args: {
        data_source_id: string;
        page_size: number;
        sorts?: Array<{ timestamp: string; direction: string }>;
      }) => Promise<QueryResponse>;
    };
  }).dataSources.query({
    data_source_id: targetDatabaseId,
    page_size: limit,
    sorts: [
      {
        timestamp: "last_edited_time",
        direction: "descending",
      },
    ],
  })) as QueryResponse;

  const options: RelationOption[] = [];

  for (const page of response.results) {
    const title = getPageTitle(page.properties);
    if (title) {
      options.push({
        id: page.id,
        title,
        icon: transformIcon(page.icon),
      });
    }
  }

  return options;
}
