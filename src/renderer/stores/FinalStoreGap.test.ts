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

        vi.stubGlobal('localStorage', mockLocalStorage);

        try {
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

    it('should handle race condition in sendRequest (success path)', async () => {
        store.setUrl('http://race.com');
        let resolveRequest: any;
        (window as any).electronAPI.makeRequest.mockImplementation(() => new Promise(resolve => {
            resolveRequest = resolve;
        }));

        const promise = store.sendRequest();

        // Change ID while pending
        runInAction(() => {
            store.activeTab.activeRequestId = 'changed-id';
        });

        resolveRequest({ status: 200, data: 'ok' });
        await promise;

        // Should NOT update response because ID changed
        expect(store.response).toBeNull();
    });

    it('should handle race condition in sendRequest (error path)', async () => {
        store.setUrl('http://race-error.com');
        let rejectRequest: any;
        (window as any).electronAPI.makeRequest.mockImplementation(() => new Promise((_, reject) => {
            rejectRequest = reject;
        }));

        const promise = store.sendRequest();

        // Change ID while pending
        runInAction(() => {
            store.activeTab.activeRequestId = 'changed-id';
        });

        // Use setTimeout to ensure the catch block executes after ID change
        // (though runInAction above is synchronous, the promise rejection handling is microtask)
        consoleSpy.mockImplementation(() => {});
        rejectRequest(new Error('fail'));

        await promise;

        // Should NOT update error state because ID changed
        // (sendRequest sets error to null initially)
        expect(store.error).toBeNull();
    });

    it('should handle success in sendRequest (normal path)', async () => {
        store.setUrl('http://normal.com');
        (window as any).electronAPI.makeRequest.mockResolvedValue({
            status: 200,
            statusText: 'OK',
            data: 'Success',
            headers: {}
        });

        await store.sendRequest();

        expect(store.response.data).toBe('Success');
        expect(store.loading).toBe(false);
    });
});
