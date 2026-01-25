import { getNotionClient } from "../client";
import type { NotionDatabase, DatabaseIcon, DatabaseCover } from "@/types/database";

interface NotionDatabaseResult {
  object: string;
  id: string;
  title: Array<{ plain_text: string }>;
  description: Array<{ plain_text: string }>;
  icon: {
    type: "emoji" | "external" | "file";
    emoji?: string;
    external?: { url: string };
    file?: { url: string };
  } | null;
  cover: {
    type: "external" | "file";
    external?: { url: string };
    file?: { url: string };
  } | null;
  last_edited_time: string;
}

/**
 * Fetch all databases accessible to the integration.
 */
export async function getDatabases(): Promise<NotionDatabase[]> {
  const client = getNotionClient();

  // Use search to find databases - cast through unknown to handle SDK type limitations
  const response = (await client.search({
    filter: {
      property: "object",
      value: "database" as "page", // SDK typing is incorrect, "database" is valid
    },
    sort: {
      direction: "descending",
      timestamp: "last_edited_time",
    },
  })) as unknown as { results: NotionDatabaseResult[] };

  // Filter to only include full database objects
  const databases = response.results.filter(
    (result) => result.object === "database" && "title" in result
  );

  return databases.map((db) => {
    // Extract title from title array
    const title = db.title?.map((t) => t.plain_text).join("") || "Untitled";

    // Extract description
    const description = db.description?.map((d) => d.plain_text).join("") || "";

    // Transform icon
    let icon: DatabaseIcon | null = null;
    if (db.icon) {
      if (db.icon.type === "emoji" && db.icon.emoji) {
        icon = { type: "emoji", emoji: db.icon.emoji };
      } else if (db.icon.type === "external" && db.icon.external) {
        icon = { type: "external", external: { url: db.icon.external.url } };
      } else if (db.icon.type === "file" && db.icon.file) {
        icon = { type: "file", file: { url: db.icon.file.url } };
      }
    }

    // Transform cover
    let cover: DatabaseCover | null = null;
    if (db.cover) {
      if (db.cover.type === "external" && db.cover.external) {
        cover = { type: "external", external: { url: db.cover.external.url } };
      } else if (db.cover.type === "file" && db.cover.file) {
        cover = { type: "file", file: { url: db.cover.file.url } };
      }
    }

    return {
      id: db.id,
      title,
      icon,
      cover,
      description,
      lastEditedTime: db.last_edited_time,
    };
  });
}
