export interface NotionDatabase {
  id: string;
  title: string;
  icon: DatabaseIcon | null;
  cover: DatabaseCover | null;
  description: string;
  lastEditedTime: string;
}

export interface DatabaseIcon {
  type: "emoji" | "external" | "file";
  emoji?: string;
  external?: { url: string };
  file?: { url: string };
}

export interface DatabaseCover {
  type: "external" | "file";
  external?: { url: string };
  file?: { url: string };
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: PropertyType;
  // For select/multi-select
  options?: SelectOption[];
  // For status
  groups?: NotionStatusGroup[];
  statusOptions?: StatusOption[];
  // For relation
  relationDatabaseId?: string;
}

export type PropertyType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "status"
  | "date"
  | "people"
  | "files"
  | "checkbox"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by";

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface NotionStatusGroup {
  id: string;
  name: string;
  color: string;
  option_ids: string[];
}

export interface StatusOption {
  id: string;
  name: string;
  color: string;
}

export interface DatabaseSchema {
  id: string;
  title: string;
  properties: DatabaseProperty[];
}
