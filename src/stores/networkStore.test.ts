import { describe, it, expect, beforeEach } from "vitest";
import { useNetworkStore } from "./networkStore";

describe("networkStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useNetworkStore.setState({
      isConnected: true,
      isInternetReachable: null,
      connectionType: null,
      isInitialized: false,
    });
  });

  describe("initial state", () => {
    it("has optimistic default for isConnected", () => {
      expect(useNetworkStore.getState().isConnected).toBe(true);
    });

    it("has null for isInternetReachable initially", () => {
      expect(useNetworkStore.getState().isInternetReachable).toBeNull();
    });

    it("has null for connectionType initially", () => {
      expect(useNetworkStore.getState().connectionType).toBeNull();
    });

    it("is not initialized by default", () => {
      expect(useNetworkStore.getState().isInitialized).toBe(false);
    });
  });

  describe("setNetworkState", () => {
    it("updates isConnected", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: false,
        isInternetReachable: null,
        connectionType: null,
      });

      expect(useNetworkStore.getState().isConnected).toBe(false);
    });

    it("updates isInternetReachable", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: null,
      });

      expect(useNetworkStore.getState().isInternetReachable).toBe(true);
    });

    it("updates connectionType", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: "wifi",
      });

      expect(useNetworkStore.getState().connectionType).toBe("wifi");
    });

    it("updates all network state fields at once", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: "cellular",
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isInternetReachable).toBe(false);
      expect(state.connectionType).toBe("cellular");
    });

    it("does not affect isInitialized", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: "wifi",
      });

      expect(useNetworkStore.getState().isInitialized).toBe(false);
    });
  });

  describe("setInitialized", () => {
    it("sets isInitialized to true", () => {
      expect(useNetworkStore.getState().isInitialized).toBe(false);

      useNetworkStore.getState().setInitialized();

      expect(useNetworkStore.getState().isInitialized).toBe(true);
    });

    it("does not affect other state", () => {
      useNetworkStore.setState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: "wifi",
        isInitialized: false,
      });

      useNetworkStore.getState().setInitialized();

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isInternetReachable).toBe(false);
      expect(state.connectionType).toBe("wifi");
      expect(state.isInitialized).toBe(true);
    });
  });

  describe("state transitions", () => {
    it("simulates going offline", () => {
      // Start online
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: "wifi",
      });
      useNetworkStore.getState().setInitialized();

      expect(useNetworkStore.getState().isConnected).toBe(true);

      // Go offline
      useNetworkStore.getState().setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: null,
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(false);
      expect(state.isInternetReachable).toBe(false);
      expect(state.connectionType).toBeNull();
    });

    it("simulates going back online", () => {
      // Start offline
      useNetworkStore.getState().setNetworkState({
        isConnected: false,
        isInternetReachable: false,
        connectionType: null,
      });
      useNetworkStore.getState().setInitialized();

      expect(useNetworkStore.getState().isConnected).toBe(false);

      // Go online
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: "cellular",
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isInternetReachable).toBe(true);
      expect(state.connectionType).toBe("cellular");
    });

    it("simulates network type change without going offline", () => {
      // Start on wifi
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: "wifi",
      });

      expect(useNetworkStore.getState().connectionType).toBe("wifi");

      // Switch to cellular
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: true,
        connectionType: "cellular",
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.connectionType).toBe("cellular");
    });
  });

  describe("edge cases", () => {
    it("handles isInternetReachable being null while connected", () => {
      useNetworkStore.getState().setNetworkState({
        isConnected: true,
        isInternetReachable: null, // Unknown state
        connectionType: "wifi",
      });

      const state = useNetworkStore.getState();
      expect(state.isConnected).toBe(true);
      expect(state.isInternetReachable).toBeNull();
    });

    it("handles rapid state changes", () => {
      const states = [
        { isConnected: true, isInternetReachable: true, connectionType: "wifi" },
        { isConnected: false, isInternetReachable: false, connectionType: null },
        { isConnected: true, isInternetReachable: true, connectionType: "cellular" },
        { isConnected: true, isInternetReachable: false, connectionType: "cellular" },
      ];

      states.forEach((state) => {
        useNetworkStore.getState().setNetworkState(state);
      });

      // Final state should be the last one
      const finalState = useNetworkStore.getState();
      expect(finalState.isConnected).toBe(true);
      expect(finalState.isInternetReachable).toBe(false);
      expect(finalState.connectionType).toBe("cellular");
    });
  });
});
