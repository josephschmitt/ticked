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
 * Fetch the schema (properties) of a data source.
 * Note: As of Notion API 2025-09-03, databases are now called "data sources".
 */
export async function getDatabaseSchema(
  dataSourceId: string
): Promise<DatabaseSchema> {
  const client = getNotionClient();

  let dataSource: DatabaseResponse;
  try {
    dataSource = (await client.dataSources.retrieve({
      data_source_id: dataSourceId,
    })) as unknown as DatabaseResponse;
  } catch (error) {
    console.error("Failed to retrieve data source schema:", error);
    if (error instanceof Error) {
      throw new Error(`Notion API error: ${error.message}`);
    }
    throw error;
  }

  // Extract title
  const title = dataSource.title?.map((t) => t.plain_text).join("") || "Untitled";

  // Transform properties
  const properties: DatabaseProperty[] = Object.entries(dataSource.properties).map(
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
    id: dataSource.id,
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
