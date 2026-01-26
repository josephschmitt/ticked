import { getNotionClient } from "../client";

interface DateField {
  propertyId: string;
  date: string;
}

interface SelectField {
  propertyId: string;
  type: "select";
  value: string;
}

interface RelationField {
  propertyId: string;
  type: "relation";
  value: string[];
}

interface UrlField {
  propertyId: string;
  url: string;
}

interface CreateTaskOptions {
  dataSourceId: string;
  titlePropertyId: string;
  title: string;
  statusPropertyId: string;
  statusName: string;
  isCheckboxStatus?: boolean;
  // Optional fields
  doDate?: DateField;
  dueDate?: DateField;
  taskType?: SelectField | RelationField;
  project?: SelectField | RelationField;
  url?: UrlField;
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
  doDate,
  dueDate,
  taskType,
  project,
  url,
}: CreateTaskOptions): Promise<string> {
  const client = getNotionClient();

  // Build status property based on type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statusProperty: any = isCheckboxStatus
    ? { checkbox: false } // New tasks with checkbox status start as unchecked (todo)
    : { status: { name: statusName } };

  // Build properties object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: Record<string, any> = {
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
  };

  // Add optional date fields
  if (doDate) {
    properties[doDate.propertyId] = {
      date: { start: doDate.date },
    };
  }
  if (dueDate) {
    properties[dueDate.propertyId] = {
      date: { start: dueDate.date },
    };
  }

  // Add optional taskType field
  if (taskType) {
    if (taskType.type === "select") {
      properties[taskType.propertyId] = {
        select: { name: taskType.value },
      };
    } else if (taskType.type === "relation") {
      properties[taskType.propertyId] = {
        relation: taskType.value.map((id) => ({ id })),
      };
    }
  }

  // Add optional project field
  if (project) {
    if (project.type === "select") {
      properties[project.propertyId] = {
        select: { name: project.value },
      };
    } else if (project.type === "relation") {
      properties[project.propertyId] = {
        relation: project.value.map((id) => ({ id })),
      };
    }
  }

  // Add optional URL field
  if (url) {
    properties[url.propertyId] = {
      url: url.url,
    };
  }

  try {
    // Use pages.create with data_source_id as parent
    const response = await client.pages.create({
      parent: {
        data_source_id: dataSourceId,
      },
      properties,
    });

    return response.id;
  } catch (error) {
    console.error("Failed to create task page:", error);
    throw error;
  }
}
