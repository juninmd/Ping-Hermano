import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';
import { requestStore } from './RequestStore';

// Mock electron API
const mockMakeRequest = vi.fn();

window.electronAPI = {
  makeRequest: mockMakeRequest,
  cancelRequest: vi.fn(),
  getFilePath: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
};

global.alert = vi.fn();

describe('RequestStore Full Coverage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.addTab();
            requestStore.url = 'https://api.example.com';
        });
    });

    it('should format response size correctly for > 1KB', async () => {
        // Create a string of length 1025 bytes
        const data = 'a'.repeat(1025);

        mockMakeRequest.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            headers: {},
            data: data
        });

        await requestStore.sendRequest();

        expect(requestStore.responseMetrics.size).toBe('1.00 KB');
    });

    it('should format response size correctly for > 1MB', async () => {
        // Create a string of length 1024 * 1025 bytes (approx 1MB)
        const data = 'a'.repeat(1024 * 1024 + 100);

        mockMakeRequest.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            headers: {},
            data: data
        });

        await requestStore.sendRequest();

        expect(requestStore.responseMetrics.size).toBe('1.00 MB');
    });

    it('should handle request error and update state correctly', async () => {
        const error = new Error('Network Error');
        mockMakeRequest.mockRejectedValueOnce(error);

        await requestStore.sendRequest();

        expect(requestStore.response).toEqual({
            status: 0,
            statusText: 'Error',
            data: 'Network Error',
            headers: {}
        });
        expect(requestStore.loading).toBe(false);
        expect(requestStore.activeTab.activeRequestId).toBeNull();
    });

    it('should NOT update state if activeRequestId has changed during error handling (race condition)', async () => {
        // This test tries to hit line 755: `if (tab.activeRequestId === requestId)` inside catch block
        // We need to simulate a race condition where the request fails, but BEFORE the catch block executes the state update,
        // the activeRequestId on the tab is changed (e.g. by a new request or cancellation).

        const error = new Error('Slow Fail');

        // Use a delayed rejection to allow us to change state "concurrently"
        mockMakeRequest.mockImplementationOnce(() => new Promise((_, reject) => {
            setTimeout(() => reject(error), 100);
        }));

        const promise = requestStore.sendRequest();

        // Immediately change the active request ID on the tab
        runInAction(() => {
            requestStore.activeTab.activeRequestId = 'different-id';
        });

        await promise;

        // The state update inside catch should have been skipped because ID didn't match
        // So response should be null (initial state) or whatever it was set to
        // sendingRequest sets response to null.
        expect(requestStore.response).toBeNull();

        // Loading might still be true because we hijacked the ID and didn't clear it?
        // Actually, sendRequest sets loading=true. We changed ID. The catch block checks ID.
        // It sees mismatch, so it does NOT set loading=false.
        // But since we manually changed ID, who is responsible for clearing loading?
        // In this specific artificial test case, we are responsible.
        // But we want to verify the catch block logic.

        // Verify console.error was called
        // We need to spy on console.error? It is called in catch block.
    });

});
