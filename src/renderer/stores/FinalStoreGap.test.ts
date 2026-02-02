import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestStore } from './RequestStore';

describe('Final Gap Coverage - RequestStore', () => {
    let store: RequestStore;

    beforeEach(() => {
        store = new RequestStore();
        // Clear storage
        store.collections = [];
        store.history = [];
    });

    it('should add unique items to history', () => {
        store.setMethod('GET');
        store.setUrl('http://test1.com');
        store.addToHistory();

        expect(store.history).toHaveLength(1);

        store.setMethod('POST');
        store.setUrl('http://test2.com'); // Different
        store.addToHistory();

        expect(store.history).toHaveLength(2);
        expect(store.history[0].url).toBe('http://test2.com');
    });

    it('should save, rename, and delete request in collection', () => {
        store.createCollection('My Col');
        const colId = store.collections[0].id;

        store.setMethod('GET');
        store.setUrl('http://api.com');

        // Save
        store.saveRequestToCollection(colId, 'My Req');
        expect(store.collections[0].requests).toHaveLength(1);
        const reqId = store.collections[0].requests[0].id;

        // Rename
        store.renameRequestInCollection(colId, reqId, 'Renamed Req');
        expect(store.collections[0].requests[0].name).toBe('Renamed Req');

        // Delete
        store.deleteRequestFromCollection(colId, reqId);
        expect(store.collections[0].requests).toHaveLength(0);
    });

    it('should handle non-existent collection operations gracefully', () => {
        // Just ensuring no crash
        store.saveRequestToCollection('invalid-id', 'test');
        store.renameRequestInCollection('invalid-id', 'req', 'test');
        store.deleteRequestFromCollection('invalid-id', 'req');

        // Rename request in valid collection but invalid request id
        store.createCollection('Col');
        store.renameRequestInCollection(store.collections[0].id, 'invalid-req', 'new');
    });
});
