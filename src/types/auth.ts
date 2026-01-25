export interface AuthTokens {
  accessToken: string;
  tokenType: string;
  botId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string | null;
  owner: AuthOwner;
}

export interface AuthOwner {
  type: "user" | "workspace";
  user?: {
    id: string;
    name: string;
    avatarUrl: string | null;
    email: string;
  };
}

export interface OAuthCallbackParams {
  code?: string;
  error?: string;
  state?: string;
}

export interface TokenExchangeRequest {
  code: string;
  redirect_uri: string;
}

export interface TokenExchangeResponse {
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

export interface TokenExchangeError {
  error: string;
  error_description?: string;
}
