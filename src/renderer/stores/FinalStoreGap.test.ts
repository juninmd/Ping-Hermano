import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestStore } from './RequestStore';
import { runInAction } from 'mobx';

describe('RequestStore Final Gap', () => {
    let store: RequestStore;

    beforeEach(() => {
        store = new RequestStore();
        vi.clearAllMocks();
        // Mock localStorage
        const storage: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
            storage[key] = value;
        });
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            return storage[key] || null;
        });
    });

    it('should return false if imported collections is not an array', () => {
        const json = JSON.stringify({ not: 'an array' });
        const result = store.importCollections(json);
        expect(result).toBe(false);
    });

    it('should import collections successfully', () => {
        const json = JSON.stringify([
            {
                id: 'col-1',
                name: 'Test Collection',
                requests: [
                    { id: 'req-1', name: 'Req 1', method: 'GET', url: 'http://test.com' }
                ]
            }
        ]);
        const result = store.importCollections(json);
        expect(result).toBe(true);
        expect(store.collections.length).toBe(1);
        expect(store.collections[0].name).toBe('Test Collection');
        expect(store.collections[0].requests.length).toBe(1);
    });

    it('should return false if imported environments is not an array', () => {
        const json = JSON.stringify({ not: 'an array' });
        const result = store.importEnvironments(json);
        expect(result).toBe(false);
    });

    it('should import environments successfully', () => {
        const json = JSON.stringify([
            {
                id: 'env-1',
                name: 'Test Env',
                variables: [
                    { key: 'VAR', value: 'VAL', enabled: true }
                ]
            }
        ]);
        const result = store.importEnvironments(json);
        expect(result).toBe(true);
        expect(store.environments.length).toBe(1);
        expect(store.environments[0].name).toBe('Test Env');
    });

    it('should handle error during cancelRequest', async () => {
        // Setup a loading request
        runInAction(() => {
            store.addTab();
            store.activeTab.loading = true;
            store.activeTab.activeRequestId = 'test-req-id';
        });

        // Mock window.electronAPI.cancelRequest to throw
        window.electronAPI = {
            cancelRequest: vi.fn().mockRejectedValue(new Error('Cancel Failed')),
            makeRequest: vi.fn(),
            getFilePath: vi.fn(),
        };

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await store.cancelRequest();

        expect(consoleSpy).toHaveBeenCalledWith('Failed to cancel', expect.any(Error));
        expect(store.activeTab.loading).toBe(false);
        expect(store.activeTab.activeRequestId).toBeNull();
        expect(store.activeTab.response).toEqual({
            status: 0,
            statusText: 'Cancelled',
            data: 'Request Cancelled',
            headers: {}
        });

        consoleSpy.mockRestore();
    });
});
