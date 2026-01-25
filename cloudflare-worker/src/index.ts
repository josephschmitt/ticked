/**
 * Cloudflare Worker for Notion OAuth token exchange
 *
 * This worker securely exchanges authorization codes for access tokens
 * without exposing the client secret to the mobile app.
 *
 * Deploy with: wrangler deploy
 * Set secrets with:
 *   wrangler secret put NOTION_CLIENT_ID
 *   wrangler secret put NOTION_CLIENT_SECRET
 */

interface Env {
  NOTION_CLIENT_ID: string;
  NOTION_CLIENT_SECRET: string;
}

interface TokenRequest {
  code: string;
  redirect_uri: string;
}

interface NotionTokenResponse {
  access_token: string;
  token_type: string;
  bot_id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_icon: string | null;
  owner: {
    type: string;
    user?: {
      id: string;
      name: string;
      avatar_url: string | null;
      type: string;
      person: { email: string };
    };
  };
  duplicated_template_id: string | null;
  request_id: string;
}

interface ErrorResponse {
  error: string;
  error_description?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

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
      return jsonResponse(
        { error: "Internal server error" },
        500
      );
    }
  },
};

function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}
