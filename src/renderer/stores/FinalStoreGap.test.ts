import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';
import { RequestStore } from './RequestStore';

describe('FinalStoreGap', () => {
    let store: RequestStore;
    let consoleSpy: any;

    beforeEach(() => {
        store = new RequestStore();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (window as any).electronAPI = {
            cancelRequest: vi.fn(),
            makeRequest: vi.fn(),
            getFilePath: vi.fn()
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete (window as any).electronAPI;
    });

    it('should handle error when cancelling request fails', async () => {
        const error = new Error('Cancel failed');
        (window as any).electronAPI.cancelRequest.mockRejectedValue(error);

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
});
