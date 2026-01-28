import { describe, it, expect, vi } from 'vitest';
import { runInAction } from 'mobx';
import { RequestStore, HistoryItem } from './RequestStore';

describe('RequestStore Gaps', () => {
    it('should handle loadHistoryItem with missing optional fields', () => {
        const store = new RequestStore();
        const emptyItem: HistoryItem = {
            id: '1',
            method: 'GET',
            url: 'http://test.com',
            date: '2023-01-01'
            // Missing body, auth, etc.
        };

        store.loadHistoryItem(emptyItem);

        expect(store.body).toBe('');
        expect(store.bodyType).toBe('text');
        expect(store.auth.type).toBe('none');
        expect(store.preRequestScript).toBe('');
        expect(store.testScript).toBe('');
    });

    it('should not save activeTabId if it is null', () => {
        const store = new RequestStore();
        runInAction(() => {
            store.activeTabId = null;
        });

        // Mock localStorage
        const setItem = vi.spyOn(Storage.prototype, 'setItem');

        store.saveTabs();

        expect(setItem).toHaveBeenCalledWith('requestTabs', expect.any(String));
        expect(setItem).not.toHaveBeenCalledWith('activeTabId', expect.anything());

        setItem.mockRestore();
    });

    it('should handle response setter', () => {
        const store = new RequestStore();
        store.response = { status: 200 };
        expect(store.activeTab.response).toEqual({ status: 200 });
    });
});
