import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestStore, HistoryItem, RequestStore } from './RequestStore';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

// Mock electronAPI
const mockMakeRequest = vi.fn();
Object.defineProperty(window, 'electronAPI', {
  value: {
    makeRequest: mockMakeRequest,
    cancelRequest: vi.fn()
  },
  writable: true
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('ZeroGapStore', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        runInAction(() => {
            requestStore.collections = [];
            requestStore.history = [];
            requestStore.tabs = [];
            requestStore.addTab();
        });
        localStorageMock.clear();
    });

    it('should handle saveRequestToCollection with invalid collection ID', () => {
        // Mock setItem to verify it is NOT called
        const setItemSpy = vi.spyOn(localStorage, 'setItem');

        runInAction(() => {
            requestStore.collections = [{ id: 'valid-id', name: 'Col', requests: [] }];
        });

        // Call with invalid ID
        requestStore.saveRequestToCollection('invalid-id', 'My Request');

        // Should not have saved to collection (so no update to localStorage for collections)
        // Note: saveRequestToCollection calls saveCollections() only if found.
        expect(setItemSpy).not.toHaveBeenCalledWith('requestCollections', expect.any(String));

        // Verify state unchanged
        expect(requestStore.collections[0].requests).toHaveLength(0);
    });

    it('should load history item with all fields populated', () => {
        const fullItem: HistoryItem = {
            id: 'hist-1',
            name: 'Full History Item',
            method: 'POST',
            url: 'http://full.com',
            headers: [{ key: 'H1', value: 'V1' }],
            body: '{"foo":"bar"}',
            bodyType: 'json',
            bodyFormData: [{ key: 'F1', value: 'FV1', type: 'text' }],
            bodyUrlEncoded: [{ key: 'U1', value: 'UV1' }],
            auth: { type: 'bearer', token: 'token123' },
            preRequestScript: 'console.log("pre")',
            testScript: 'console.log("test")',
            date: '2024-01-01'
        };

        requestStore.loadHistoryItem(fullItem);

        // Verify active tab state
        expect(requestStore.method).toBe('POST');
        expect(requestStore.url).toBe('http://full.com');
        // Headers has extra empty one appended, plus Content-Type (from bodyType=json) and Authorization (from auth=bearer)
        // Order: Auth and Content-Type are usually unshifted (added to top).
        expect(requestStore.headers.length).toBeGreaterThanOrEqual(2);
        expect(requestStore.headers.find(h => h.key === 'H1')).toEqual({ key: 'H1', value: 'V1' });
        expect(requestStore.headers.find(h => h.key === 'Content-Type')).toEqual({ key: 'Content-Type', value: 'application/json' });
        expect(requestStore.headers.find(h => h.key === 'Authorization')).toBeDefined();

        expect(requestStore.body).toBe('{"foo":"bar"}');
        expect(requestStore.bodyType).toBe('json');

        expect(requestStore.bodyFormData).toHaveLength(1);
        expect(requestStore.bodyFormData[0]).toEqual({ key: 'F1', value: 'FV1', type: 'text' });

        expect(requestStore.bodyUrlEncoded).toHaveLength(1);
        expect(requestStore.bodyUrlEncoded[0]).toEqual({ key: 'U1', value: 'UV1' });

        expect(requestStore.auth).toEqual({ type: 'bearer', token: 'token123' });
        expect(requestStore.preRequestScript).toBe('console.log("pre")');
        expect(requestStore.testScript).toBe('console.log("test")');
    });

    it('should handle request ID mismatch (cancelled/superseded)', async () => {
        // Mock success but delayed
        vi.spyOn(window.electronAPI, 'makeRequest').mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 10));
            return { status: 200, statusText: 'OK', data: '', headers: {} };
        });

        runInAction(() => {
            requestStore.url = 'http://test.com';
        });

        const promise = requestStore.sendRequest();

        // While pending, change activeRequestId (simulate cancellation or new request)
        runInAction(() => {
            requestStore.activeTab.activeRequestId = 'different-id';
        });

        await promise;

        // Verify that the response was NOT applied
        expect(requestStore.response).toBeNull();
        expect(requestStore.loading).toBe(true); // Should stick to loading or whatever state new request sets (here just mocked manual change)
        // Actually, if we just changed ID, loading might still be true from previous, but since we didn't start new request logic fully, just verify response is null.
    });
});
