import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInAction } from 'mobx';
import { requestStore } from './RequestStore';

describe('RequestStore Gap Coverage', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        runInAction(() => {
            requestStore.headers = [{ key: '', value: '' }];
            requestStore.url = '';
            requestStore.auth = { type: 'none' };
        });

        // Mock electronAPI
        if (!window.electronAPI) {
            window.electronAPI = {
                makeRequest: vi.fn().mockResolvedValue({}),
                cancelRequest: vi.fn(),
                getFilePath: vi.fn()
            } as any;
        }
    });

    it('should load history item with undefined headers (else branch)', () => {
        const item = {
            id: '1',
            method: 'GET',
            url: 'http://test.com',
            // headers is undefined
            body: '',
            date: ''
        };

        requestStore.loadHistoryItem(item as any);

        expect(requestStore.headers).toHaveLength(1);
        expect(requestStore.headers[0]).toEqual({ key: '', value: '' });
    });

    it('should load history item with empty headers array', () => {
        const item = {
            id: '2',
            method: 'GET',
            url: 'http://test.com',
            headers: [],
            body: '',
            date: ''
        };

        requestStore.loadHistoryItem(item as any);

        expect(requestStore.headers).toHaveLength(1);
        expect(requestStore.headers[0]).toEqual({ key: '', value: '' });
    });

    it('should append API Key to query params (no existing params)', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com/resource';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
            };
        });

        await requestStore.sendRequest();

        expect(window.electronAPI.makeRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://api.com/resource?api_key=12345'
        }));
    });

    it('should append API Key to query params (existing params)', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com/resource?q=test';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
            };
        });

        await requestStore.sendRequest();

        expect(window.electronAPI.makeRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://api.com/resource?q=test&api_key=12345'
        }));
    });

    it('should handle API Key with invalid addTo', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'k', value: 'v', addTo: 'invalid' as any }
            };
        });

        await requestStore.sendRequest();

        expect(window.electronAPI.makeRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://api.com',
            headers: [] // No header added
        }));
    });

    it('should handle API Key when apiKey object is undefined', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.auth = {
                type: 'apikey',
                apiKey: undefined
            };
        });

        await requestStore.sendRequest();

        // Should proceed without error and not add anything
        expect(window.electronAPI.makeRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://api.com'
        }));
    });
});
