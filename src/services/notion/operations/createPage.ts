import { getNotionClient } from "../client";

interface CreateTaskOptions {
  dataSourceId: string;
  titlePropertyId: string;
  title: string;
  statusPropertyId: string;
  statusName: string;
  isCheckboxStatus?: boolean;
}

/**
 * Create a new task page in the specified data source.
 * Returns the ID of the created page.
 */
export async function createTaskPage({
  dataSourceId,
  titlePropertyId,
  title,
  statusPropertyId,
  statusName,
  isCheckboxStatus = false,
}: CreateTaskOptions): Promise<string> {
  const client = getNotionClient();

  // Build status property based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusProperty: any = isCheckboxStatus
    ? { checkbox: false } // New tasks with checkbox status start as unchecked (todo)
    : { status: { name: statusName } };

  try {
    // Use pages.create with data_source_id as parent
    const response = await client.pages.create({
      parent: {
        // @ts-expect-error - Notion API uses data_source_id for newer databases
        data_source_id: dataSourceId,
      },
      properties: {
        [titlePropertyId]: {
          title: [
            {
              type: "text",
              text: {
                content: title,
              },
            },
          ],
        },
        [statusPropertyId]: statusProperty,
      },
    });

    return response.id;
  } catch (error) {
    console.error("Failed to create task page:", error);
    throw error;
  }
}
