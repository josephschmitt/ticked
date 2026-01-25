// Status group background colors
export const STATUS_GROUP_COLORS = {
  todo: {
    light: "#f3f4f6", // gray-100
    dark: "#374151", // gray-700
  },
  inProgress: {
    light: "#dbeafe", // blue-100
    dark: "#1e3a5f", // blue-900ish
  },
  complete: {
    light: "#dcfce7", // green-100
    dark: "#14532d", // green-900
  },
} as const;

// Notion property colors mapped to hex values
export const NOTION_COLORS = {
  default: { light: "#e5e5e5", dark: "#404040" },
  gray: { light: "#e5e5e5", dark: "#404040" },
  brown: { light: "#fef3c7", dark: "#78350f" },
  orange: { light: "#fed7aa", dark: "#7c2d12" },
  yellow: { light: "#fef08a", dark: "#713f12" },
  green: { light: "#bbf7d0", dark: "#14532d" },
  blue: { light: "#bfdbfe", dark: "#1e3a8a" },
  purple: { light: "#ddd6fe", dark: "#4c1d95" },
  pink: { light: "#fbcfe8", dark: "#831843" },
  red: { light: "#fecaca", dark: "#7f1d1d" },
} as const;

// Primary brand colors
export const BRAND_COLORS = {
  primary: "#6366f1", // Indigo-500
  primaryDark: "#4f46e5", // Indigo-600
  primaryLight: "#818cf8", // Indigo-400
} as const;

export type NotionColor = keyof typeof NOTION_COLORS;
export type StatusGroupType = keyof typeof STATUS_GROUP_COLORS;
