# Contributing to Ticked

Thanks for your interest in contributing to Ticked! This document outlines the process for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 18+
- iOS Simulator (macOS) or Android Emulator
- Expo Go app on your physical device (optional)

### Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm start
   ```

### Running on Device

**iOS Simulator:**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Physical Device:**
Scan the QR code from `npm start` with the Expo Go app.

## Project Architecture

### Directory Structure

- `app/` - Expo Router file-based routing
- `src/components/` - Reusable React components
- `src/hooks/` - Custom hooks and TanStack Query hooks
- `src/services/` - API clients, auth, storage utilities
- `src/stores/` - Zustand state stores
- `src/types/` - TypeScript type definitions
- `cloudflare-worker/` - OAuth proxy (separate deployment)

### State Management

- **Server State**: TanStack Query for Notion API data (caching, refetching)
- **Client State**: Zustand stores with persistence
  - `authStore` - OAuth tokens (SecureStore)
  - `configStore` - Database selection, field mapping (AsyncStorage)

### Styling

We use [NativeWind](https://nativewind.dev) (Tailwind CSS for React Native). Use `className` props with Tailwind utilities:

```tsx
<View className="flex-1 items-center justify-center bg-white dark:bg-black">
  <Text className="text-lg font-semibold text-gray-900 dark:text-white">
    Hello World
  </Text>
</View>
```

### Path Aliases

TypeScript path aliases are configured for cleaner imports:

```tsx
import { useAuthStore } from "@/stores/authStore";
import { TaskCard } from "@/components/tasks/TaskCard";
```

## Making Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates

### Commit Messages

Use clear, descriptive commit messages:

```
Add pull-to-refresh on task list

Implement RefreshControl on the main task list view.
Uses TanStack Query's refetch functionality.
```

### Code Style

- Use TypeScript for all new files
- Follow existing patterns in the codebase
- Use functional components with hooks
- Prefer `const` over `let`

### Testing Changes

Before submitting a PR:

1. Test on iOS (simulator or device)
2. Test on Android if possible
3. Verify dark mode works correctly
4. Check that TypeScript has no errors:
   ```bash
   npx tsc --noEmit
   ```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Update documentation if needed
4. Open a PR with a clear description of changes
5. Ensure CI checks pass
6. Request review

### PR Description Template

```markdown
## Summary
Brief description of what this PR does.

## Changes
- Change 1
- Change 2

## Testing
How was this tested?

## Screenshots
(if applicable)
```

## Cloudflare Worker

The OAuth proxy worker is in `cloudflare-worker/`. If you need to modify it:

```bash
cd cloudflare-worker
npm install
npx wrangler dev      # Local development
npx wrangler deploy   # Deploy changes
```

## Questions?

Open an issue for questions or discussion about potential changes.
