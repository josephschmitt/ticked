# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ticked is a React Native (Expo) mobile app that displays tasks from Notion databases, inspired by Hypersonic. It provides a native-feeling experience on iOS/iPadOS/Mac. Users authenticate via Notion OAuth, select a database, map Notion properties to app fields, and view their tasks grouped by status.

## Commands

```bash
# Development
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator

# Cloudflare Worker (OAuth proxy)
cd cloudflare-worker
npx wrangler deploy                          # Deploy worker
npx wrangler secret put NOTION_CLIENT_ID     # Set secrets
npx wrangler secret put NOTION_CLIENT_SECRET
```

## Architecture

### Tech Stack
- **Framework**: Expo (SDK 54) with Expo Router for file-based routing
- **UI**: NativeWind (Tailwind for React Native) + Gluestack UI patterns
- **State (Server)**: TanStack Query for caching, refetching, loading states
- **State (Client)**: Zustand with persistence
- **Auth**: expo-auth-session for native OAuth
- **Storage**: expo-secure-store (tokens) + AsyncStorage (preferences)
- **Notion**: @notionhq/client official SDK

### App Structure (Expo Router)
- `app/_layout.tsx` - Root layout with QueryClient, store hydration, error boundary
- `app/(auth)/` - Landing page and OAuth callback handling
- `app/(setup)/` - Database selection and field mapping configuration
- `app/(main)/` - Task list view and settings

### Navigation Flow
```
App Entry → Check auth/config state
    ├── Not authenticated → (auth)/landing → OAuth → callback
    ├── Authenticated but not configured → (setup)/databases → field-mapping
    └── Fully configured → (main)/index (Task List)
```

### State Management
Two Zustand stores with persistence:
- **authStore** - OAuth tokens, workspace info (persisted to SecureStore)
- **configStore** - Selected database, field mapping (persisted to AsyncStorage)

Both stores have `hydrate()` methods called on app start to restore persisted state.

### OAuth Flow
The app uses a Cloudflare Worker (`cloudflare-worker/`) as a proxy for token exchange to keep the client secret secure:
1. App opens Notion auth URL via expo-auth-session
2. User authorizes, Notion redirects back with auth code
3. App sends code to Cloudflare Worker
4. Worker exchanges code for tokens using client secret
5. Worker returns tokens to app
6. App stores tokens in SecureStore

### Data Flow
1. **Notion API**: `src/services/notion/client.ts` creates authenticated clients using tokens from authStore
2. **Data fetching**: TanStack Query hooks in `src/hooks/queries/` fetch and cache Notion data
3. **Field mapping**: Users map Notion properties to app fields - this mapping transforms Notion pages into Task objects

### Field Mapping
Maps Notion database properties to app fields (`src/types/fieldMapping.ts`):

| App Field | Notion Property Types | Required |
|-----------|----------------------|----------|
| taskName | title | Yes |
| status | status, checkbox | Yes |
| taskType | select, relation | No |
| project | select, relation | No |
| doDate | date | No |
| dueDate | date | No |
| url | url | No |
| creationDate | created_time, date | No |
| completedDate | date | No |

### Key Types
- `Task` / `TaskStatus` / `StatusGroup` - App's internal task representation (`src/types/task.ts`)
- `FieldMapping` - Maps app fields to Notion property IDs (`src/types/fieldMapping.ts`)

## Notion API Guidelines

**CRITICAL**: As of Notion API version 2025-09-03, "databases" are now called "data sources". Always use the new API methods and field names:

### API Methods
| Old (deprecated) | New (use this) |
|-----------------|----------------|
| `client.databases.retrieve()` | `client.dataSources.retrieve()` |
| `client.databases.query()` | `client.dataSources.query()` |
| `client.search({ filter: { value: "database" }})` | `client.search({ filter: { value: "data_source" }})` |

### Field Names in API Calls
| Old (deprecated) | New (use this) |
|-----------------|----------------|
| `database_id` | `data_source_id` |

### Response Parsing
When reading API responses, **prefer `data_source_id` but fall back to `database_id`** for compatibility:

```typescript
// Relation properties in schema
const relationTargetId = prop.relation.data_source_id ?? prop.relation.database_id;

// Page parent objects
const parentId = page.parent.data_source_id ?? page.parent.database_id;

// Parent type checking
if (page.parent.type === "database_id" || page.parent.type === "data_source_id") { ... }
```

### Variable Naming
Internal variables can still use "database" for clarity (e.g., `databaseId`, `selectedDatabaseId`), but API calls must use `data_source_id`.

## Environment Setup

Copy `.env.example` to `.env` and set:
- `EXPO_PUBLIC_NOTION_CLIENT_ID` - From Notion integration (https://www.notion.so/my-integrations)
- `EXPO_PUBLIC_OAUTH_PROXY_URL` - Deployed Cloudflare Worker URL

The Notion integration must be set to "Public" type for OAuth to work.

## Path Aliases

TypeScript paths configured in tsconfig.json:
- `@/*` → `./src/*`
- `@/components/*`, `@/services/*`, `@/stores/*`, `@/hooks/*`, `@/types/*`

## Git Commands

Expo Router uses parentheses in folder names for route groups (e.g., `app/(auth)/`, `app/(main)/`). Always quote these paths in git commands to prevent shell interpretation:

```bash
# Correct
git add "app/(setup)/field-mapping.tsx"
git diff "app/(auth)/"

# Incorrect - parentheses may cause errors
git add app/(setup)/field-mapping.tsx
```
