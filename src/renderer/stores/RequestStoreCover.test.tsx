import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestStore } from './RequestStore';
import { runInAction } from 'mobx';

describe('RequestStore Coverage', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.collections = [];
            requestStore.addTab(); // Ensure active tab exists
        });
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should load tabs and set activeTabId if found', () => {
        const tabs = [
            { id: 'tab1', name: 'Tab 1' },
            { id: 'tab2', name: 'Tab 2' }
        ];
        localStorage.setItem('requestTabs', JSON.stringify(tabs));
        localStorage.setItem('activeTabId', 'tab2');

        requestStore.loadTabs();

        expect(requestStore.tabs).toHaveLength(2);
        expect(requestStore.activeTabId).toBe('tab2');
    });

    it('should set response via store setter', () => {
        const responseData = { status: 200, data: 'test' };

        requestStore.response = responseData;

        expect(requestStore.activeTab.response).toEqual(responseData);
    });

    it('should rename request in collection', () => {
        runInAction(() => {
            requestStore.createCollection('My Col');
        });
        const colId = requestStore.collections[0].id;
        runInAction(() => {
            requestStore.saveRequestToCollection(colId, 'Original Name');
        });
        const reqId = requestStore.collections[0].requests[0].id;

        requestStore.renameRequestInCollection(colId, reqId, 'New Name');

        expect(requestStore.collections[0].requests[0].name).toBe('New Name');
    });

    it('should not rename request if not found', () => {
        runInAction(() => {
            requestStore.createCollection('My Col');
        });
        const colId = requestStore.collections[0].id;
        runInAction(() => {
            requestStore.saveRequestToCollection(colId, 'Original Name');
        });

        requestStore.renameRequestInCollection(colId, 'invalid-req-id', 'New Name');

        expect(requestStore.collections[0].requests[0].name).toBe('Original Name');
    });

     it('should not rename request if collection not found', () => {
        requestStore.renameRequestInCollection('invalid-col-id', 'req-id', 'New Name');
        // Should not throw
    });
});
