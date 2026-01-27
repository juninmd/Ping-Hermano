import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestStore, requestStore } from './RequestStore';

describe('RequestStore Edge Cases', () => {
  let store: RequestStore;

  beforeEach(() => {
    localStorage.clear();
    store = new RequestStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loadTabs should handle invalid JSON', () => {
    localStorage.setItem('requestTabs', 'invalid-json');
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const newStore = new RequestStore();
    newStore.loadTabs();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load tabs', expect.any(Error));
    expect(newStore.tabs.length).toBeGreaterThan(0); // Should have default tab
  });

  it('loadTabs should handle empty array JSON', () => {
    localStorage.setItem('requestTabs', '[]');
    const newStore = new RequestStore();
    expect(newStore.tabs.length).toBe(1); // Should create default tab
  });

  it('importCollections should handle invalid JSON', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = store.importCollections('invalid-json');
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to import collections', expect.any(Error));
  });

  it('importEnvironments should handle invalid JSON', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = store.importEnvironments('invalid-json');
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to import environments', expect.any(Error));
  });

  it('parseQueryParams should handle errors gracefully', () => {
    // We need to mock URLSearchParams to throw error
    // Since it's a global, we need to be careful
    const originalURLSearchParams = global.URLSearchParams;

    global.URLSearchParams = class {
        constructor() {
            throw new Error('Parsing error');
        }
        append() {}
        toString() { return ''; }
        forEach() {}
        get() { return null; }
        getAll() { return []; }
        has() { return false; }
        delete() {}
        set() {}
        sort() {}
        entries() { return [][Symbol.iterator](); }
        keys() { return [][Symbol.iterator](); }
        values() { return [][Symbol.iterator](); }
        [Symbol.iterator]() { return [][Symbol.iterator](); }
        size = 0;
    } as any;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a tab or use existing
    const tab = store.activeTab;

    // Set queryParams to empty to hit the fallback branch in catch block
    tab.setQueryParams([]);

    tab.setUrl('http://example.com?foo=bar');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to parse query params', expect.any(Error));
    // Should fallback to empty/default params
    expect(tab.queryParams.length).toBe(1);
    expect(tab.queryParams[0]).toEqual({ key: '', value: '' });

    // Restore
    global.URLSearchParams = originalURLSearchParams;
  });

  it('updateUrlFromParams should handle errors gracefully', () => {
     const originalURLSearchParams = global.URLSearchParams;

    // Mock to throw on construction which happens in updateUrlFromParams
    global.URLSearchParams = class {
        constructor() {
            throw new Error('Update error');
        }
         append() {}
        toString() { return ''; }
        forEach() {}
        get() { return null; }
        getAll() { return []; }
        has() { return false; }
        delete() {}
        set() {}
        sort() {}
        entries() { return [][Symbol.iterator](); }
        keys() { return [][Symbol.iterator](); }
        values() { return [][Symbol.iterator](); }
        [Symbol.iterator]() { return [][Symbol.iterator](); }
        size = 0;
    } as any;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const tab = store.activeTab;
    tab.setQueryParams([{ key: 'foo', value: 'bar' }]);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to update url from params', expect.any(Error));

    global.URLSearchParams = originalURLSearchParams;
  });

  it('should use default tab if activeTabId is not found', () => {
      store.addTab(); // tab 1
      store.addTab(); // tab 2
      const tab1Id = store.tabs[0].id;
      store.setActiveTab('non-existent-id');

      expect(store.activeTab.id).toBe(tab1Id);
  });
});
