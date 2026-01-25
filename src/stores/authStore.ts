import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  workspaceId: string | null;
  workspaceName: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (token: string, workspaceId: string, workspaceName: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  workspaceId: null,
  workspaceName: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (token, workspaceId, workspaceName) =>
    set({
      accessToken: token,
      workspaceId,
      workspaceName,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      accessToken: null,
      workspaceId: null,
      workspaceName: null,
      isAuthenticated: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  // Will be implemented in Milestone 4
  hydrate: async () => {
    set({ isLoading: false });
  },
}));
