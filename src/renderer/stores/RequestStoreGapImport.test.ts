import { describe, it, expect } from 'vitest';
import { requestStore } from '../stores/RequestStore';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('RequestStore Gap Import Tests', () => {
    it('should import collection with missing requests array', () => {
        const json = JSON.stringify([{
            id: '1',
            name: 'Col No Reqs'
            // requests missing
        }]);

        const result = requestStore.importCollections(json);
        expect(result).toBe(true);
        expect(requestStore.collections).toHaveLength(1);
        expect(requestStore.collections[0].name).toBe('Col No Reqs');
        expect(requestStore.collections[0].requests).toEqual([]);
    });
});
