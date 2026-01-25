export * from "./storage";
export * from "./colors";

// OAuth configuration
export const OAUTH_CONFIG = {
  authorizationEndpoint: "https://api.notion.com/v1/oauth/authorize",
  redirectUri: "notiontodos://oauth/callback",
  scopes: ["read_content", "read_user"],
} as const;

// API configuration
export const API_CONFIG = {
  notionVersion: "2022-06-28",
  baseUrl: "https://api.notion.com/v1",
} as const;
