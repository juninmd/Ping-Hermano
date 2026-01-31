import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestStore } from './RequestStore';

const mockMakeRequest = vi.fn();
window.electronAPI = {
  makeRequest: mockMakeRequest,
} as any;

describe('RequestStore Race Conditions', () => {
  let store: RequestStore;

  beforeEach(() => {
    localStorage.clear();
    store = new RequestStore();
    mockMakeRequest.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should ignore response if activeRequestId changed (success)', async () => {
      store.setUrl('http://race-success.com');

      let resolveRequest: (value: any) => void;
      mockMakeRequest.mockImplementation(() => new Promise(resolve => {
          resolveRequest = resolve;
      }));

      // Start Request 1
      const requestPromise = store.sendRequest();
      const requestId1 = store.activeTab.activeRequestId;

      expect(store.loading).toBe(true);
      expect(requestId1).toBeDefined();

      // Simulate starting Request 2 (or cancelling) which changes activeRequestId
      // Manually force a new request ID on the tab to simulate the race
      const requestId2 = 'new-id';
      store.activeTab.activeRequestId = requestId2;

      // Now resolve Request 1
      resolveRequest!({
          status: 200,
          statusText: 'OK',
          data: 'Success 1',
          headers: {}
      });

      await requestPromise;

      // The store should NOT have updated with Request 1's data because ID changed
      // It should assume it's still loading (for Request 2) or whatever state Request 2 left it in
      // In this specific test setup, we just manually changed the ID, so loading might still be true
      // strictly speaking, but the RESPONSE should not be 'Success 1'.

      // Since we didn't actually start Request 2 via sendRequest (just hacked the ID),
      // response should be null (reset at start of Request 1)
      expect(store.response).toBeNull();

      // If the response HAD processed, activeRequestId would be set to null.
      // Since it was ignored, activeRequestId should still be 'new-id'
      expect(store.activeTab.activeRequestId).toBe('new-id');
  });

  it('should ignore error if activeRequestId changed (failure)', async () => {
      store.setUrl('http://race-error.com');

      let rejectRequest: (reason?: any) => void;
      mockMakeRequest.mockImplementation(() => new Promise((_, reject) => {
          rejectRequest = reject;
      }));

      // Start Request 1
      const requestPromise = store.sendRequest();
      const requestId1 = store.activeTab.activeRequestId;

      expect(store.loading).toBe(true);

      // Simulate change
      store.activeTab.activeRequestId = 'new-id';

      // Reject Request 1
      rejectRequest!(new Error('Fail 1'));

      await requestPromise;

      // Should ignore error
      expect(store.error).toBeNull(); // sendRequest sets error to null at start
      expect(store.response).toBeNull(); // sendRequest sets response to null at start

      // activeRequestId should remain 'new-id'
      expect(store.activeTab.activeRequestId).toBe('new-id');
  });

  it('should handle cancellation correctly (activeRequestId becomes null)', async () => {
      store.setUrl('http://cancel.com');

      let resolveRequest: (value: any) => void;
      mockMakeRequest.mockImplementation(() => new Promise(resolve => {
          resolveRequest = resolve;
      }));

      const requestPromise = store.sendRequest();

      // Simulate Cancel
      store.activeTab.activeRequestId = null;
      store.loading = false; // Usually cancel sets loading false

      resolveRequest!({ status: 200 });

      await requestPromise;

      expect(store.response).toBeNull();
  });
});
