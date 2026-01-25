import { create } from "zustand";
import {
  storeAuthTokens,
  getAuthTokens,
  clearAuthTokens,
} from "@/services/storage/secureStorage";

interface AuthState {
  accessToken: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  botId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (params: {
    accessToken: string;
    workspaceId: string;
    workspaceName: string;
    botId: string;
  }) => Promise<void>;
  clearAuth: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  workspaceId: null,
  workspaceName: null,
  botId: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (params) => {
    // Store in secure storage
    await storeAuthTokens(params);

    // Update state
    set({
      accessToken: params.accessToken,
      workspaceId: params.workspaceId,
      workspaceName: params.workspaceName,
      botId: params.botId,
      isAuthenticated: true,
    });
  },

  clearAuth: async () => {
    // Clear from secure storage
    await clearAuthTokens();

    // Update state
    set({
      accessToken: null,
      workspaceId: null,
      workspaceName: null,
      botId: null,
      isAuthenticated: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: async () => {
    try {
      const tokens = await getAuthTokens();

      if (tokens.accessToken) {
        set({
          accessToken: tokens.accessToken,
          workspaceId: tokens.workspaceId,
          workspaceName: tokens.workspaceName,
          botId: tokens.botId,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to hydrate auth store:", error);
      set({ isLoading: false });
    }
  },
}));
