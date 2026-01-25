import { getNotionClient } from "../client";
import type {
  DatabaseSchema,
  DatabaseProperty,
  PropertyType,
  SelectOption,
  NotionStatusGroup,
  StatusOption,
} from "@/types/database";

interface SelectOptionResponse {
  id: string;
  name: string;
  color: string;
}

interface StatusGroupResponse {
  id: string;
  name: string;
  color: string;
  option_ids: string[];
}

interface PropertyResponse {
  id: string;
  type: string;
  select?: { options: SelectOptionResponse[] };
  multi_select?: { options: SelectOptionResponse[] };
  status?: {
    options: SelectOptionResponse[];
    groups: StatusGroupResponse[];
  };
}

interface DatabaseResponse {
  id: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, PropertyResponse>;
}

/**
 * Fetch the schema (properties) of a database.
 */
export async function getDatabaseSchema(
  databaseId: string
): Promise<DatabaseSchema> {
  const client = getNotionClient();

  const database = (await client.databases.retrieve({
    database_id: databaseId,
  })) as unknown as DatabaseResponse;

  // Extract title
  const title = database.title?.map((t) => t.plain_text).join("") || "Untitled";

  // Transform properties
  const properties: DatabaseProperty[] = Object.entries(database.properties).map(
    ([name, prop]) => {
      const baseProperty: DatabaseProperty = {
        id: prop.id,
        name,
        type: prop.type as PropertyType,
      };

      // Add select options if applicable
      if (prop.type === "select" && prop.select?.options) {
        baseProperty.options = prop.select.options.map(
          (opt): SelectOption => ({
            id: opt.id,
            name: opt.name,
            color: opt.color,
          })
        );
      }

      // Add multi-select options
      if (prop.type === "multi_select" && prop.multi_select?.options) {
        baseProperty.options = prop.multi_select.options.map(
          (opt): SelectOption => ({
            id: opt.id,
            name: opt.name,
            color: opt.color,
          })
        );
      }

      // Add status options and groups
      if (prop.type === "status" && prop.status) {
        baseProperty.statusOptions = prop.status.options.map(
          (opt): StatusOption => ({
            id: opt.id,
            name: opt.name,
            color: opt.color,
          })
        );

        baseProperty.groups = prop.status.groups.map(
          (group): NotionStatusGroup => ({
            id: group.id,
            name: group.name,
            color: group.color,
            option_ids: group.option_ids,
          })
        );
      }

      return baseProperty;
    }
  );

  return {
    id: database.id,
    title,
    properties,
  };
}

/**
 * Get properties filtered by allowed types for field mapping.
 */
export function filterPropertiesByType(
  properties: DatabaseProperty[],
  allowedTypes: string[]
): DatabaseProperty[] {
  return properties.filter((prop) => allowedTypes.includes(prop.type));
}
