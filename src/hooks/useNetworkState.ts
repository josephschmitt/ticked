import { useEffect, useRef } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useNetworkStore } from "@/stores/networkStore";

/**
 * Hook to initialize and subscribe to network state changes.
 * Should be called once at the app root level.
 */
export function useNetworkStateInit() {
  const setNetworkState = useNetworkStore((state) => state.setNetworkState);
  const setInitialized = useNetworkStore((state) => state.setInitialized);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
      setInitialized();
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkState({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [setNetworkState, setInitialized]);
}

/**
 * Hook to access current network state.
 */
export function useNetworkState() {
  const isConnected = useNetworkStore((state) => state.isConnected);
  const isInternetReachable = useNetworkStore((state) => state.isInternetReachable);
  const connectionType = useNetworkStore((state) => state.connectionType);
  const isInitialized = useNetworkStore((state) => state.isInitialized);

  // Consider offline only if we're sure there's no connection
  // isInternetReachable can be null during initial detection
  const isOffline = isInitialized && !isConnected;

  // Consider online if connected and internet is reachable (or unknown)
  const isOnline = isConnected && (isInternetReachable !== false);

  return {
    isConnected,
    isInternetReachable,
    connectionType,
    isInitialized,
    isOffline,
    isOnline,
  };
}
