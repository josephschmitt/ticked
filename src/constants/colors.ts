// iOS System Colors
export const IOS_COLORS = {
  red: '#FF3B30',
  orange: '#FF9500',
  yellow: '#FFCC00',
  green: '#34C759',
  teal: '#5AC8FA',
  blue: '#007AFF',
  purple: '#AF52DE',
  pink: '#FF2D55',
} as const;

// iOS Grays
export const IOS_GRAYS = {
  system: '#8E8E93',
  gray2: '#AEAEB2',
  gray3: '#C7C7CC',
  gray4: '#D1D1D6',
  gray5: '#E5E5EA',
  gray6: '#F2F2F7',
} as const;

// iOS Semantic Backgrounds
export const IOS_BACKGROUNDS = {
  primary: { light: '#FFFFFF', dark: '#000000' },
  grouped: { light: '#F2F2F7', dark: '#000000' },
  elevated: { light: '#FFFFFF', dark: '#1C1C1E' },
} as const;

// iOS Labels
export const IOS_LABELS = {
  primary: { light: '#000000', dark: '#FFFFFF' },
  secondary: { light: 'rgba(60,60,67,0.6)', dark: 'rgba(235,235,245,0.6)' },
  tertiary: { light: 'rgba(60,60,67,0.3)', dark: 'rgba(235,235,245,0.3)' },
} as const;

// iOS Separators
export const IOS_SEPARATORS = {
  default: { light: 'rgba(60,60,67,0.29)', dark: 'rgba(84,84,88,0.6)' },
} as const;

// Primary brand colors (app tint)
export const BRAND_COLORS = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
} as const;

// Notion property colors mapped to hex values (kept for compatibility)
export const NOTION_COLORS = {
  default: { light: '#e5e5e5', dark: '#404040' },
  gray: { light: '#e5e5e5', dark: '#404040' },
  brown: { light: '#fef3c7', dark: '#78350f' },
  orange: { light: '#fed7aa', dark: '#7c2d12' },
  yellow: { light: '#fef08a', dark: '#713f12' },
  green: { light: '#bbf7d0', dark: '#14532d' },
  blue: { light: '#bfdbfe', dark: '#1e3a8a' },
  purple: { light: '#ddd6fe', dark: '#4c1d95' },
  pink: { light: '#fbcfe8', dark: '#831843' },
  red: { light: '#fecaca', dark: '#7f1d1d' },
} as const;

export type NotionColor = keyof typeof NOTION_COLORS;
