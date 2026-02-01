import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestStore } from './RequestStore';

describe('RequestStore Load Error Handling', () => {
    let store: RequestStore;
    let consoleSpy;

    beforeEach(() => {
        vi.restoreAllMocks();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.clear();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    it('should handle JSON parse error in loadHistory', () => {
        // Mock Storage.prototype.getItem
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'requestHistory') return 'invalid-json';
            return null;
        });

        store = new RequestStore();

        expect(consoleSpy).toHaveBeenCalledWith('Failed to parse history', expect.any(Error));
        expect(store.history).toEqual([]);
    });

    it('should handle JSON parse error in loadEnvironments', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'environments') return 'invalid-json';
            return null;
        });

        store = new RequestStore();

        expect(consoleSpy).toHaveBeenCalledWith('Failed to parse environments', expect.any(Error));
        expect(store.environments).toEqual([]);
    });

    it('should load activeEnvironmentId if present', () => {
         vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
            if (key === 'activeEnvironmentId') return 'env-123';
            if (key === 'environments') return '[]';
            return null;
        });

        store = new RequestStore();

        expect(store.activeEnvironmentId).toBe('env-123');
    });
});
