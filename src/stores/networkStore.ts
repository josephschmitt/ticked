import { create } from "zustand";

interface NetworkState {
  /** Whether the device is currently connected to the network */
  isConnected: boolean;
  /** Whether the network connection is considered "good" (e.g., wifi or cellular) */
  isInternetReachable: boolean | null;
  /** The type of network connection (wifi, cellular, etc.) */
  connectionType: string | null;
  /** Whether the network state has been initialized */
  isInitialized: boolean;

  /** Update the network state */
  setNetworkState: (state: {
    isConnected: boolean;
    isInternetReachable: boolean | null;
    connectionType: string | null;
  }) => void;
  /** Mark the store as initialized */
  setInitialized: () => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isConnected: true, // Optimistic default
  isInternetReachable: null,
  connectionType: null,
  isInitialized: false,

  setNetworkState: (state) => {
    set({
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      connectionType: state.connectionType,
    });
  },

  setInitialized: () => {
    set({ isInitialized: true });
  },
}));
