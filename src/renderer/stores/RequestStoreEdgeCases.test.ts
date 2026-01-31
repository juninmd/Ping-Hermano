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


  it('should use default tab if activeTabId is not found', () => {
      store.addTab(); // tab 1
      store.addTab(); // tab 2
      const tab1Id = store.tabs[0].id;
      store.setActiveTab('non-existent-id');

      expect(store.activeTab.id).toBe(tab1Id);
  });
});
