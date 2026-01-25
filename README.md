# Ticked

A React Native mobile app that displays tasks from Notion databases, inspired by [Hypersonic](https://hypersonic.app). Provides a native-feeling experience on iOS, iPadOS, and Mac.

## Features

- **Notion Integration**: Connect to your Notion workspace via OAuth
- **Database Selection**: Choose which Notion database to sync
- **Field Mapping**: Map your Notion properties to app fields (status, dates, projects, etc.)
- **Task Grouping**: View tasks grouped by status (To-do, In Progress, Complete)
- **Dark Mode**: Automatic theme based on system preference
- **Pull to Refresh**: Keep your tasks in sync

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Cloudflare account](https://dash.cloudflare.com) (free tier works)
- [Notion account](https://notion.so) with a database to sync

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/josephschmitt/ticked.git
cd ticked
npm install
```

### 2. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it (e.g., "Ticked")
4. Set type to **"Public"** (required for OAuth)
5. Under OAuth & Permissions:
   - Add redirect URI: `ticked://oauth/callback`
   - Enable: Read content, Read user information
6. Save and copy your **Client ID** and **Client Secret**

### 3. Deploy the OAuth Proxy (Cloudflare Worker)

The app uses a Cloudflare Worker to securely exchange OAuth tokens without exposing the client secret.

```bash
cd cloudflare-worker
npm install
npx wrangler login        # Authenticate with Cloudflare
npx wrangler deploy       # Deploy the worker
```

After deployment, note your worker URL (e.g., `https://ticked-oauth-proxy.xxx.workers.dev`).

Set the secrets:

```bash
npx wrangler secret put NOTION_CLIENT_ID
# Paste your Notion client ID

npx wrangler secret put NOTION_CLIENT_SECRET
# Paste your Notion client secret
```

### 4. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_NOTION_CLIENT_ID=your_notion_client_id
EXPO_PUBLIC_OAUTH_PROXY_URL=https://ticked-oauth-proxy.xxx.workers.dev
```

### 5. Run the App

```bash
npm start
```

Scan the QR code with the Expo Go app on your device, or press `i` for iOS simulator.

## Development

```bash
npm start           # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
```

### Project Structure

```
ticked/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Login/OAuth screens
│   ├── (setup)/           # Database & field mapping
│   └── (main)/            # Task list & settings
├── src/
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks & queries
│   ├── services/          # API clients & auth
│   ├── stores/            # Zustand state stores
│   └── types/             # TypeScript definitions
├── cloudflare-worker/     # OAuth proxy worker
└── assets/                # Images & icons
```

### Tech Stack

- **Framework**: [Expo](https://expo.dev) SDK 54 with [Expo Router](https://docs.expo.dev/router/introduction/)
- **Styling**: [NativeWind](https://nativewind.dev) (Tailwind CSS for React Native)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) (client) + [TanStack Query](https://tanstack.com/query) (server)
- **Auth**: [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- **Storage**: [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) + AsyncStorage
- **API**: [@notionhq/client](https://github.com/makenotion/notion-sdk-js)

## Troubleshooting

### "expected dynamic type 'boolean', but had type 'string'"

This error occurs when Expo Go has a stale cached bundle. **Force-quit Expo Go** completely (swipe away from app switcher) and reconnect.

### OAuth callback not working

Ensure your Notion integration has the correct redirect URI: `ticked://oauth/callback`

### Worker not responding

Check that your secrets are set correctly:

```bash
cd cloudflare-worker
npx wrangler secret list
```

## License

MIT
