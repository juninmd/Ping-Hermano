import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';
import { RequestStore } from './RequestStore';

describe('FinalStoreGap', () => {
    let store: RequestStore;
    let consoleSpy: any;

    beforeEach(() => {
        store = new RequestStore();
        // Spy on console.error but allow it to print (no mockImplementation)
        // verify spy works
        consoleSpy = vi.spyOn(console, 'error');
        (window as any).electronAPI = {
            cancelRequest: vi.fn(),
            makeRequest: vi.fn(),
            getFilePath: vi.fn()
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        delete (window as any).electronAPI;
    });

    it('should handle error when cancelling request fails', async () => {
        const error = new Error('Cancel failed');
        (window as any).electronAPI.cancelRequest.mockRejectedValue(error);
        consoleSpy.mockImplementation(() => {});

        runInAction(() => {
            store.addTab();
            store.activeTab.loading = true;
            store.activeTab.activeRequestId = '123';
        });

        await store.cancelRequest();

        expect(consoleSpy).toHaveBeenCalledWith("Failed to cancel", error);
        // Should still cleanup
        expect(store.activeTab.loading).toBe(false);
        expect(store.activeTab.activeRequestId).toBeNull();
        expect(store.activeTab.response.statusText).toBe('Cancelled');
    });

    it('should preserve existing response if set during cancellation (race condition)', async () => {
        (window as any).electronAPI.cancelRequest.mockResolvedValue(undefined);

        runInAction(() => {
            store.addTab();
            store.activeTab.loading = true; // Still "loading" UI-wise
            store.activeTab.activeRequestId = '123';
            // Simulate response arriving just before cancel logic finishes
            store.activeTab.response = { status: 200, statusText: 'OK', data: 'Success', headers: {} };
        });

        await store.cancelRequest();

        expect(store.activeTab.loading).toBe(false);
        expect(store.activeTab.activeRequestId).toBeNull();
        // Should NOT be 'Cancelled'
        expect(store.activeTab.response.statusText).toBe('OK');
        expect(store.activeTab.response.data).toBe('Success');
    });

    // Mocking localStorage for error handling
    const mockLocalStorageError = (methodName: string, callMethod: () => void, errorMsg: string) => {
        const mockGetItem = vi.fn().mockImplementation((key) => {
            // console.log(`DEBUG: getItem called with ${key}`);
            return 'invalid-json';
        });

        const mockLocalStorage = {
            getItem: mockGetItem,
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
        };

        // Stub global localStorage
        vi.stubGlobal('localStorage', mockLocalStorage);

        // Stub JSON.parse to ensure it throws?
        // 'invalid-json' should trigger SyntaxError naturally.

        try {
            // Silence console during this specific call
            consoleSpy.mockImplementation(() => {});
            callMethod();

            expect(mockGetItem).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(errorMsg, expect.any(Error));
        } finally {
            vi.unstubAllGlobals();
        }
    };

    it('should handle error when loading tabs fails', () => {
        mockLocalStorageError('loadTabs', () => store.loadTabs(), "Failed to load tabs");
    });

    it('should handle error when loading history fails', () => {
        mockLocalStorageError('loadHistory', () => store.loadHistory(), "Failed to parse history");
    });

    it('should handle error when loading collections fails', () => {
        mockLocalStorageError('loadCollections', () => store.loadCollections(), "Failed to parse collections");
    });

    it('should handle error when loading environments fails', () => {
        mockLocalStorageError('loadEnvironments', () => store.loadEnvironments(), "Failed to parse environments");
    });
});
