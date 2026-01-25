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

### 2. Deploy the OAuth Proxy (Cloudflare Worker)

The app uses a Cloudflare Worker to handle OAuth redirects and token exchange. Deploy it first to get the callback URL needed for Notion.

```bash
cd cloudflare-worker
npm install
npx wrangler login        # Authenticate with Cloudflare
npx wrangler deploy       # Deploy the worker
```

After deployment, note your worker URL (e.g., `https://ticked-oauth-proxy.xxx.workers.dev`).

### 3. Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Name it (e.g., "Ticked")
4. Upload a logo (required for public integrations)
5. Set type to **"Public"** (required for OAuth)
6. Under OAuth & Permissions:
   - Add redirect URI: `https://ticked-oauth-proxy.<your-subdomain>.workers.dev/callback`
     (Use your worker URL from step 2, with `/callback` at the end)
   - Enable: Read content, Read user information
7. Save and copy your **Client ID** and **Client Secret**

### 4. Configure Worker Secrets

Back in the `cloudflare-worker` directory, set the Notion credentials:

```bash
npx wrangler secret put NOTION_CLIENT_ID
# Paste your Notion client ID

npx wrangler secret put NOTION_CLIENT_SECRET
# Paste your Notion client secret
```

### 5. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_NOTION_CLIENT_ID=your_notion_client_id
EXPO_PUBLIC_OAUTH_PROXY_URL=https://ticked-oauth-proxy.xxx.workers.dev
```

### 6. Run the App

```bash
npm start --clear
```

> **Note**: Always use `--clear` after changing environment variables to ensure Expo picks up the new values.

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

### "OAuth proxy URL not configured"

This error means your `.env` file is missing or Expo hasn't loaded the new environment variables. Make sure:
1. `.env` exists in the project root with `EXPO_PUBLIC_OAUTH_PROXY_URL` set
2. Restart Expo with `npm start --clear` after changing env vars

### "expected dynamic type 'boolean', but had type 'string'"

This error occurs when Expo Go has a stale cached bundle. **Force-quit Expo Go** completely (swipe away from app switcher) and reconnect.

### OAuth callback not working

Ensure your Notion integration has the correct redirect URI matching your worker URL:
`https://ticked-oauth-proxy.<your-subdomain>.workers.dev/callback`

### Worker not responding

Check that your secrets are set correctly:

```bash
cd cloudflare-worker
npx wrangler secret list
```

## License

MIT
