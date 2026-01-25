/**
 * Cloudflare Worker for Notion OAuth
 *
 * Handles two flows:
 * 1. GET /callback - Receives OAuth callback from Notion, redirects to app
 * 2. POST / - Exchanges authorization code for access token
 *
 * Deploy with: wrangler deploy
 * Set secrets with:
 *   wrangler secret put NOTION_CLIENT_ID
 *   wrangler secret put NOTION_CLIENT_SECRET
 */

// App scheme for deep linking
const APP_SCHEME = "ticked";

interface Env {
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
}

interface TokenRequest {
  code: string;
  redirect_uri: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /callback - OAuth redirect from Notion
    if (request.method === "GET" && url.pathname === "/callback") {
      return handleOAuthCallback(url);
    }

    // POST / - Token exchange
    if (request.method === "POST") {
      return handleTokenExchange(request, env, url);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};

/**
 * Handle OAuth callback from Notion.
 * Redirects to the app with the authorization code.
 */
function handleOAuthCallback(url: URL): Response {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Build the app deep link
  const appUrl = new URL(`${APP_SCHEME}://oauth/callback`);

  if (error) {
    appUrl.searchParams.set("error", error);
    const errorDescription = url.searchParams.get("error_description");
    if (errorDescription) {
      appUrl.searchParams.set("error_description", errorDescription);
    }
  } else if (code) {
    appUrl.searchParams.set("code", code);
    if (state) {
      appUrl.searchParams.set("state", state);
    }
  } else {
    appUrl.searchParams.set("error", "missing_code");
  }

  // Redirect to the app
  return new Response(null, {
    status: 302,
    headers: {
      Location: appUrl.toString(),
    },
  });
}

/**
 * Handle token exchange request from the app.
 */
async function handleTokenExchange(
  request: Request,
  env: Env,
  url: URL
): Promise<Response> {
  // Validate content type
  const contentType = request.headers.get("Content-Type");
  if (!contentType?.includes("application/json")) {
    return jsonResponse({ error: "Content-Type must be application/json" }, 400);
  }

  try {
    const body = (await request.json()) as TokenRequest;

    // Validate required fields
    if (!body.code) {
      return jsonResponse({ error: "Missing required field: code" }, 400);
    }
    if (!body.redirect_uri) {
      return jsonResponse({ error: "Missing required field: redirect_uri" }, 400);
    }

    // Validate environment
    if (!env.NOTION_CLIENT_ID || !env.NOTION_CLIENT_SECRET) {
      console.error("Missing environment variables");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    // Create Basic auth header
    const credentials = btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`);

    // Exchange code for token with Notion
    const tokenResponse = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: body.code,
        redirect_uri: body.redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    // Return Notion's response (success or error)
    return jsonResponse(tokenData, tokenResponse.status);
  } catch (error) {
    console.error("Token exchange error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
