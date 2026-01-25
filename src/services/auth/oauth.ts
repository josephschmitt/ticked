import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { OAUTH_CONFIG } from "@/constants";
import type {
  TokenExchangeResponse,
  TokenExchangeError,
  AuthTokens,
} from "@/types/auth";

// Required for web browser redirect
WebBrowser.maybeCompleteAuthSession();

/**
 * Get the OAuth proxy URL from environment or constants.
 */
function getOAuthProxyUrl(): string {
  const url =
    Constants.expoConfig?.extra?.oauthProxyUrl ||
    process.env.EXPO_PUBLIC_OAUTH_PROXY_URL;

  if (!url) {
    throw new Error("OAuth proxy URL not configured");
  }
  return url;
}

/**
 * Get the OAuth callback URL (worker's /callback endpoint).
 * This is used as the redirect_uri for Notion OAuth.
 */
export function getOAuthCallbackUrl(): string {
  const proxyUrl = getOAuthProxyUrl();
  return `${proxyUrl}/callback`;
}

/**
 * Get the Notion client ID from environment.
 */
function getClientId(): string {
  const clientId =
    Constants.expoConfig?.extra?.notionClientId ||
    process.env.EXPO_PUBLIC_NOTION_CLIENT_ID;

  if (!clientId) {
    throw new Error("Notion client ID not configured");
  }
  return clientId;
}

/**
 * Start the OAuth flow by opening the Notion authorization page.
 * Uses the worker's /callback endpoint as the redirect URI.
 */
export async function startOAuthFlow(state?: string): Promise<WebBrowser.WebBrowserResult> {
  const authUrl = buildAuthorizationUrl(state);
  return WebBrowser.openAuthSessionAsync(authUrl, "ticked://oauth/callback");
}

/**
 * Exchange an authorization code for access tokens via the Cloudflare Worker proxy.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<AuthTokens> {
  const proxyUrl = getOAuthProxyUrl();

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as TokenExchangeError;
    throw new Error(error.error_description || error.error || "Token exchange failed");
  }

  const tokenResponse = data as TokenExchangeResponse;

  // Transform to our internal format
  return {
    accessToken: tokenResponse.access_token,
    tokenType: tokenResponse.token_type,
    botId: tokenResponse.bot_id,
    workspaceId: tokenResponse.workspace_id,
    workspaceName: tokenResponse.workspace_name,
    workspaceIcon: tokenResponse.workspace_icon,
    owner: {
      type: tokenResponse.owner.type as "user" | "workspace",
      user: tokenResponse.owner.user
        ? {
            id: tokenResponse.owner.user.id,
            name: tokenResponse.owner.user.name,
            avatarUrl: tokenResponse.owner.user.avatar_url,
            email: tokenResponse.owner.user.person.email,
          }
        : undefined,
    },
  };
}

/**
 * Build the Notion authorization URL.
 * Uses the worker's /callback endpoint as the redirect URI.
 */
export function buildAuthorizationUrl(state?: string): string {
  const clientId = getClientId();
  const redirectUri = getOAuthCallbackUrl();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
  });

  if (state) {
    params.set("state", state);
  }

  return `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;
}
