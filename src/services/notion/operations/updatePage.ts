import { getNotionClient } from "../client";

/**
 * Core update function using client.pages.update().
 * Updates one or more properties on a Notion page.
 */
export async function updatePageProperties(
  pageId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>
): Promise<void> {
  const client = getNotionClient();

  await client.pages.update({
    page_id: pageId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: properties as any,
  });
}

/**
 * Update a task's status property (for status-type properties).
 */
export async function updateTaskStatus(
  pageId: string,
  propertyId: string,
  statusName: string
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      status: {
        name: statusName,
      },
    },
  });
}

/**
 * Update a task's checkbox property.
 */
export async function updateTaskCheckbox(
  pageId: string,
  propertyId: string,
  checked: boolean
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      checkbox: checked,
    },
  });
}

/**
 * Update a task's title property.
 */
export async function updateTaskTitle(
  pageId: string,
  propertyId: string,
  title: string
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      title: [
        {
          type: "text",
          text: {
            content: title,
          },
        },
      ],
    },
  });
}

/**
 * Update a task's date property.
 * Pass null to clear the date.
 */
export async function updateTaskDate(
  pageId: string,
  propertyId: string,
  date: string | null
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      date: date ? { start: date } : null,
    },
  });
}

/**
 * Update a task's select property.
 * Pass null to clear the selection.
 */
export async function updateTaskSelect(
  pageId: string,
  propertyId: string,
  optionName: string | null
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      select: optionName ? { name: optionName } : null,
    },
  });
}

/**
 * Update a task's relation property.
 * Pass an empty array to clear all relations.
 */
export async function updateTaskRelation(
  pageId: string,
  propertyId: string,
  pageIds: string[]
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      relation: pageIds.map((id) => ({ id })),
    },
  });
}

/**
 * Update a task's URL property.
 * Pass null to clear the URL.
 */
export async function updateTaskUrl(
  pageId: string,
  propertyId: string,
  url: string | null
): Promise<void> {
  await updatePageProperties(pageId, {
    [propertyId]: {
      url: url || null,
    },
  });
}
