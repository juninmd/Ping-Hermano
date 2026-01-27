import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestStore, Header, QueryParam, Auth, HistoryItem } from './RequestStore';

// Mock electronAPI
const mockMakeRequest = vi.fn();
window.electronAPI = {
  makeRequest: mockMakeRequest,
} as any;

describe('RequestStore', () => {
  let store: RequestStore;

  beforeEach(() => {
    localStorage.clear();
    store = new RequestStore();
    mockMakeRequest.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Method', () => {
    it('should set method', () => {
      store.setMethod('POST');
      expect(store.method).toBe('POST');
    });
  });

  describe('URL and Query Params', () => {
    it('should set url and parse query params', () => {
      store.setUrl('https://api.example.com?foo=bar&baz=qux');
      expect(store.url).toBe('https://api.example.com?foo=bar&baz=qux');
      expect(store.queryParams).toHaveLength(3); // foo, baz, empty
      expect(store.queryParams[0]).toEqual({ key: 'foo', value: 'bar' });
      expect(store.queryParams[1]).toEqual({ key: 'baz', value: 'qux' });
    });

    it('should handle url without query params', () => {
        store.setUrl('https://api.example.com');
        expect(store.queryParams).toHaveLength(1);
        expect(store.queryParams[0]).toEqual({ key: '', value: '' });
    });

    it('should handle url with empty query string', () => {
        store.setUrl('https://api.example.com?');
        expect(store.queryParams).toHaveLength(1);
        expect(store.queryParams[0]).toEqual({ key: '', value: '' });
    });

    it('should update url when query params change', () => {
        store.setUrl('https://api.example.com');
        store.setQueryParams([
            { key: 'foo', value: 'bar' },
            { key: '', value: '' }
        ]);
        expect(store.url).toBe('https://api.example.com?foo=bar');
    });

    it('should remove query string from url when params are cleared', () => {
        store.setUrl('https://api.example.com?foo=bar');
        store.setQueryParams([{ key: '', value: '' }]);
        expect(store.url).toBe('https://api.example.com');
    });

    it('should handle parsing errors gracefully', () => {
        // Mock URLSearchParams to throw error
        const originalURLSearchParams = global.URLSearchParams;
        // Use a class that throws in constructor
        global.URLSearchParams = class MockURLSearchParams {
             constructor() { throw new Error('Parsing error'); }
             [Symbol.iterator]() { return [][Symbol.iterator](); }
             append() {}
             delete() {}
             get() { return null; }
             getAll() { return []; }
             has() { return false; }
             set() {}
             sort() {}
             toString() { return ''; }
             forEach() {}
             entries() { return [][Symbol.iterator](); }
             keys() { return [][Symbol.iterator](); }
             values() { return [][Symbol.iterator](); }
             size = 0;
        } as any;

        const badUrl = 'https://example.com?a=b';
        // Should catch error and fallback/maintain default
        store.setUrl(badUrl);
        expect(store.queryParams).toHaveLength(1); // Default empty

        global.URLSearchParams = originalURLSearchParams;
    });

    it('should handle existing params when setting empty url', () => {
        store.setQueryParams([{ key: 'a', value: 'b' }, { key: '', value: '' }]);
        store.setUrl('');
        // Logic says: if !searchPart, and we have params, clear params.
        expect(store.queryParams).toHaveLength(1);
        expect(store.queryParams[0]).toEqual({ key: '', value: '' });
    });
  });

  describe('Headers', () => {
    it('should set headers', () => {
        const headers = [{ key: 'Content-Type', value: 'application/json' }];
        store.setHeaders(headers);
        expect(store.headers).toEqual(headers);
    });
  });

  describe('Body', () => {
    it('should set body', () => {
        store.setBody('{"foo":"bar"}');
        expect(store.body).toBe('{"foo":"bar"}');
    });
  });

  describe('Scripts', () => {
      it('should set pre-request script', () => {
          store.setPreRequestScript('console.log("pre")');
          expect(store.preRequestScript).toBe('console.log("pre")');
      });

      it('should set test script', () => {
          store.setTestScript('console.log("test")');
          expect(store.testScript).toBe('console.log("test")');
      });
  });

  describe('Authentication', () => {
      it('should set auth and update header for basic auth', () => {
          store.setAuth({ type: 'basic', username: 'user', password: 'pass' });
          expect(store.auth.type).toBe('basic');
          const authHeader = store.headers.find(h => h.key === 'Authorization');
          expect(authHeader).toBeDefined();
          expect(authHeader?.value).toBe('Basic ' + btoa('user:pass'));
      });

      it('should set auth and update header for bearer auth', () => {
          store.setAuth({ type: 'bearer', token: '123' });
          expect(store.auth.type).toBe('bearer');
          const authHeader = store.headers.find(h => h.key === 'Authorization');
          expect(authHeader).toBeDefined();
          expect(authHeader?.value).toBe('Bearer 123');
      });

      it('should remove auth header when type is none', () => {
          store.setAuth({ type: 'basic', username: 'u', password: 'p' });
          expect(store.headers.some(h => h.key === 'Authorization')).toBe(true);

          store.setAuth({ type: 'none' });
          expect(store.headers.some(h => h.key === 'Authorization')).toBe(false);
      });

      it('should handle basic auth without username/password', () => {
          store.setAuth({ type: 'basic' });
          const authHeader = store.headers.find(h => h.key === 'Authorization');
          expect(authHeader?.value).toBe('Basic ' + btoa(':'));
      });

      it('should add empty row if headers become empty after removing auth', () => {
          // If headers only had authorization and we remove it
          store.headers = [{ key: 'Authorization', value: '...' }];
          store.setAuth({ type: 'none' });
          expect(store.headers).toHaveLength(1);
          expect(store.headers[0]).toEqual({ key: '', value: '' });
      });

      it('should add empty row if last header is not empty after auth update', () => {
          // Case: Headers = [H1], Last is H1 (non-empty). Auth adds Authorization.
          // Headers become [Auth, H1]. Last is H1. Need to append empty.
          store.headers = [{ key: 'H1', value: 'V1' }];
          store.setAuth({ type: 'bearer', token: 't' });

          // Should be [Auth, H1, Empty]
          expect(store.headers).toHaveLength(3);
          expect(store.headers[0].key).toBe('Authorization');
          expect(store.headers[1].key).toBe('H1');
          expect(store.headers[2]).toEqual({ key: '', value: '' });
      });
  });

  describe('Body Type and Content-Type', () => {
    it('should set body type to json and add Content-Type header', () => {
        store.setBodyType('json');
        expect(store.bodyType).toBe('json');
        expect(store.headers[0]).toEqual({ key: 'Content-Type', value: 'application/json' });
    });

    it('should set body type to text and remove Content-Type header', () => {
        store.setBodyType('json');
        expect(store.headers).toHaveLength(2); // Content-Type + empty

        store.setBodyType('text');
        expect(store.bodyType).toBe('text');
        expect(store.headers).toHaveLength(1); // empty
        expect(store.headers[0]).toEqual({ key: '', value: '' });
    });

    it('should preserve other headers when changing body type', () => {
        store.setHeaders([{ key: 'H1', value: 'V1' }, { key: '', value: '' }]);
        store.setBodyType('json');
        expect(store.headers).toHaveLength(3); // Content-Type, H1, empty
        expect(store.headers[0].key).toBe('Content-Type');
        expect(store.headers[1].key).toBe('H1');
    });

    it('should ensure empty row at end when updating content type', () => {
        store.setHeaders([{ key: 'H1', value: 'V1' }]);
        store.setBodyType('json');
        // Expect: Content-Type, H1, Empty
        expect(store.headers).toHaveLength(3);
        expect(store.headers[2]).toEqual({ key: '', value: '' });
    });
  });

  describe('History', () => {
      it('should load history from local storage', () => {
          const history = [{ id: '1', method: 'GET', url: 'http://test.com', date: 'now' }];
          localStorage.setItem('requestHistory', JSON.stringify(history));
          // Re-create store to trigger loadHistory in constructor
          store = new RequestStore();
          expect(store.history).toHaveLength(1);
          expect(store.history[0].id).toBe('1');
      });

      it('should handle invalid history json', () => {
        localStorage.setItem('requestHistory', 'invalid json');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Re-create store to trigger loadHistory in constructor
        store = new RequestStore();
        expect(store.history).toEqual([]);
        consoleSpy.mockRestore();
      });

      it('should save history to local storage', () => {
          store.history = [{ id: '1', method: 'GET', url: 'http://test.com', date: 'now' }];
          store.saveHistory();
          expect(localStorage.getItem('requestHistory')).toContain('http://test.com');
      });

      it('should add to history', () => {
          store.setUrl('http://example.com');
          store.setMethod('GET');
          store.addToHistory();
          expect(store.history).toHaveLength(1);
          expect(store.history[0].url).toBe('http://example.com');
      });

      it('should deduplicate history', () => {
          store.setUrl('http://example.com');
          store.setMethod('GET');
          store.addToHistory();
          store.addToHistory();
          expect(store.history).toHaveLength(1);
      });

      it('should limit history size', () => {
        store.history = Array(50).fill(null).map((_, i) => ({
             id: i.toString(), method: 'GET', url: `http://${i}.com`, date: 'now'
        }));
        store.setUrl('http://new.com');
        store.addToHistory();
        expect(store.history).toHaveLength(50);
        expect(store.history[0].url).toBe('http://new.com');
      });

      it('should clear history', () => {
          store.setUrl('http://example.com');
          store.addToHistory();
          store.clearHistory();
          expect(store.history).toHaveLength(0);
          expect(localStorage.getItem('requestHistory')).toBe('[]');
      });

      it('should load history item', () => {
          const item: HistoryItem = {
              id: '1',
              method: 'POST',
              url: 'http://load.com',
              headers: [{ key: 'h1', value: 'v1' }],
              body: 'b',
              bodyType: 'json',
              auth: { type: 'basic', username: 'u', password: 'p' },
              preRequestScript: 'pre',
              testScript: 'test',
              date: 'now'
          };
          store.loadHistoryItem(item);
          expect(store.method).toBe('POST');
          expect(store.url).toBe('http://load.com');

          // Headers: 'h1' (from item) + 'Content-Type' (from json bodyType) + 'Authorization' (from auth) + empty
          expect(store.headers).toHaveLength(4);

          expect(store.body).toBe('b');
          expect(store.bodyType).toBe('json');
          expect(store.auth.type).toBe('basic');
          expect(store.preRequestScript).toBe('pre');
          expect(store.testScript).toBe('test');
      });

      it('should load history item with defaults', () => {
          const item: HistoryItem = {
              id: '1',
              method: 'GET',
              url: 'http://load.com',
              date: 'now'
          };
          store.loadHistoryItem(item);
          expect(store.headers).toEqual([{ key: '', value: ''}]);
          expect(store.body).toBe('');
          expect(store.auth.type).toBe('none');
      });
  });

  describe('Collections', () => {
      it('should load collections', () => {
          const collections = [{ id: '1', name: 'Col1', requests: [] }];
          localStorage.setItem('requestCollections', JSON.stringify(collections));
          // Re-create store to trigger loadCollections in constructor
          store = new RequestStore();
          expect(store.collections).toHaveLength(1);
      });

      it('should handle invalid collections json', () => {
          localStorage.setItem('requestCollections', 'invalid');
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          // Re-create store to trigger loadCollections in constructor
          store = new RequestStore();
          expect(store.collections).toEqual([]);
          consoleSpy.mockRestore();
      });

      it('should handle invalid environments json', () => {
          localStorage.setItem('environments', 'invalid');
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          store = new RequestStore();
          expect(store.environments).toEqual([]);
          consoleSpy.mockRestore();
      });

      it('should create collection', () => {
          store.createCollection('New Col');
          expect(store.collections).toHaveLength(1);
          expect(store.collections[0].name).toBe('New Col');
      });

      it('should delete collection', () => {
          store.createCollection('To Delete');
          const id = store.collections[0].id;
          store.deleteCollection(id);
          expect(store.collections).toHaveLength(0);
      });

      it('should save request to collection', () => {
          store.createCollection('My Col');
          const colId = store.collections[0].id;
          store.setUrl('http://saved.com');
          store.saveRequestToCollection(colId, 'My Req');
          expect(store.collections[0].requests).toHaveLength(1);
          expect(store.collections[0].requests[0].name).toBe('My Req');
          expect(store.collections[0].requests[0].url).toBe('http://saved.com');
      });

       it('should not save request to non-existent collection', () => {
          store.saveRequestToCollection('999', 'My Req');
          expect(store.collections).toHaveLength(0);
      });

      it('should delete request from collection', () => {
          store.createCollection('My Col');
          const colId = store.collections[0].id;
          store.saveRequestToCollection(colId, 'My Req');
          const reqId = store.collections[0].requests[0].id;
          store.deleteRequestFromCollection(colId, reqId);
          expect(store.collections[0].requests).toHaveLength(0);
      });

      it('should not delete request from non-existent collection', () => {
          store.createCollection('My Col');
          store.deleteRequestFromCollection('999', '1');
          expect(store.collections[0].requests).toHaveLength(0);
      });
  });

  describe('Send Request', () => {
      it('should alert if url is empty', async () => {
          store.setUrl('');
          const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
          await store.sendRequest();
          expect(alertSpy).toHaveBeenCalledWith('Please enter a URL');
          alertSpy.mockRestore();
      });

      it('should send request successfully', async () => {
          store.setUrl('http://success.com');
          mockMakeRequest.mockResolvedValue({
              status: 200,
              statusText: 'OK',
              data: { success: true },
              headers: {}
          });

          await store.sendRequest();
          expect(store.loading).toBe(false);
          expect(store.response).toEqual({
              status: 200,
              statusText: 'OK',
              data: { success: true },
              headers: {}
          });
          expect(store.history).toHaveLength(1);
      });

      it('should handle request error', async () => {
          store.setUrl('http://error.com');
          const error = new Error('Network Error');
          mockMakeRequest.mockRejectedValue(error);

          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

          await store.sendRequest();

          expect(store.loading).toBe(false);
          expect(store.response).toEqual({
              status: 0,
              statusText: 'Error',
              data: 'Network Error',
              headers: {}
          });
          consoleSpy.mockRestore();
      });

      it('should calculate size string correctly', async () => {
           store.setUrl('http://size.com');

           // Small
           mockMakeRequest.mockResolvedValue({ data: '123' });
           await store.sendRequest();
           expect(store.responseMetrics.size).toContain('B');

           // KB
           mockMakeRequest.mockResolvedValue({ data: 'a'.repeat(2000) });
           await store.sendRequest();
           expect(store.responseMetrics.size).toContain('KB');

           // MB
           mockMakeRequest.mockResolvedValue({ data: 'a'.repeat(1024 * 1024 + 10) });
           await store.sendRequest();
           expect(store.responseMetrics.size).toContain('MB');
      });
  });

  describe('Environments', () => {
      it('should create environment', () => {
          store.createEnvironment('Test Env');
          expect(store.environments).toHaveLength(1);
          expect(store.environments[0].name).toBe('Test Env');
          expect(store.activeEnvironmentId).toBe(store.environments[0].id);
      });

      it('should update environment', () => {
          store.createEnvironment('Test Env');
          const id = store.environments[0].id;
          store.updateEnvironment(id, 'Updated Env', [{ key: 'var', value: 'val', enabled: true }]);
          expect(store.environments[0].name).toBe('Updated Env');
          expect(store.environments[0].variables[0].key).toBe('var');
      });

      it('should ignore update for non-existent environment', () => {
          store.createEnvironment('Test Env');
          store.updateEnvironment('invalid-id', 'Updated Env', []);
          expect(store.environments[0].name).toBe('Test Env');
      });

      it('should delete environment', () => {
          store.createEnvironment('Test Env');
          const id = store.environments[0].id;
          store.deleteEnvironment(id);
          expect(store.environments).toHaveLength(0);
          expect(store.activeEnvironmentId).toBeNull();
      });

      it('should set active environment', () => {
          store.createEnvironment('Env 1');
          store.createEnvironment('Env 2');
          const id1 = store.environments[0].id;
          const id2 = store.environments[1].id;

          store.setActiveEnvironment(id2);
          expect(store.activeEnvironmentId).toBe(id2);

          store.setActiveEnvironment(null);
          expect(store.activeEnvironmentId).toBeNull();
      });

      it('should persist environments and active state', () => {
          store.createEnvironment('Persist Env');
          const id = store.environments[0].id;

          // Mimic reloading store (constructor loads from localStorage)
          const newStore = new RequestStore();
          expect(newStore.environments).toHaveLength(1);
          expect(newStore.activeEnvironmentId).toBe(id);
      });

      it('should pass environment variables to request', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.createEnvironment('My Env');
          const id = store.environments[0].id;
          store.updateEnvironment(id, 'My Env', [
              { key: 'baseUrl', value: 'http://api.com', enabled: true },
              { key: 'secret', value: 'hidden', enabled: false }
          ]);

          store.setUrl('http://example.com');
          await store.sendRequest();

          expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              environment: { baseUrl: 'http://api.com' }
          }));
      });
  });

  describe('Form Data and URL Encoded', () => {
      it('should set form data', () => {
          const data = [{ key: 'k', value: 'v', type: 'text' as const }];
          store.setBodyFormData(data);
          expect(store.bodyFormData).toEqual(data);
      });

      it('should set url encoded data', () => {
          const data = [{ key: 'k', value: 'v' }];
          store.setBodyUrlEncoded(data);
          expect(store.bodyUrlEncoded).toEqual(data);
      });

      it('should set Content-Type for x-www-form-urlencoded', () => {
          store.setBodyType('x-www-form-urlencoded');
          expect(store.headers[0]).toEqual({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
      });

      it('should update Content-Type when switching from json to x-www-form-urlencoded', () => {
          store.setBodyType('json');
          expect(store.headers[0].value).toBe('application/json');
          store.setBodyType('x-www-form-urlencoded');
          expect(store.headers[0].value).toBe('application/x-www-form-urlencoded');
      });

      it('should ensure empty header row exists when setting body type', () => {
          // Setup headers without empty row
          store.setHeaders([{ key: 'H1', value: 'V1' }]);

          store.setBodyType('json');

          // Should have: Content-Type, H1, Empty
          expect(store.headers).toHaveLength(3);
          expect(store.headers[2]).toEqual({ key: '', value: '' });
      });

      it('should not set Content-Type for form-data (let runtime handle boundary)', () => {
          store.setBodyType('form-data');
          // Should not have content-type
          expect(store.headers.some(h => h.key.toLowerCase() === 'content-type')).toBe(false);
      });

      it('should pass form data to request', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.setBodyType('form-data');
          store.setBodyFormData([{ key: 'k', value: 'v', type: 'text' }]);
          store.setUrl('http://example.com');
          await store.sendRequest();

           expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              bodyType: 'form-data',
              bodyFormData: [{ key: 'k', value: 'v', type: 'text' }]
          }));
      });

      it('should pass url encoded data to request', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.setBodyType('x-www-form-urlencoded');
          store.setBodyUrlEncoded([{ key: 'k', value: 'v' }]);
          store.setUrl('http://example.com');
          await store.sendRequest();

           expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              bodyType: 'x-www-form-urlencoded',
              bodyUrlEncoded: [{ key: 'k', value: 'v' }]
          }));
      });
  });

  describe('API Key Auth', () => {
      it('should inject API Key into header', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.setAuth({
              type: 'apikey',
              apiKey: { key: 'X-API-KEY', value: '12345', addTo: 'header' }
          });
          store.setUrl('http://example.com');
          await store.sendRequest();

          expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              headers: expect.arrayContaining([{ key: 'X-API-KEY', value: '12345' }])
          }));
      });

      it('should inject API Key into query param', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.setAuth({
              type: 'apikey',
              apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
          });
          store.setUrl('http://example.com');
          await store.sendRequest();

          expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              url: 'http://example.com?api_key=12345'
          }));
      });

      it('should append API Key to existing query params', async () => {
          mockMakeRequest.mockResolvedValue({ data: '' });
          store.setAuth({
              type: 'apikey',
              apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
          });
          store.setUrl('http://example.com?foo=bar');
          await store.sendRequest();

          expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
              url: 'http://example.com?foo=bar&api_key=12345'
          }));
      });
  });

  describe('Import/Export', () => {
      it('should export collections as JSON', () => {
          store.createCollection('Test Col');
          const json = store.exportCollections();
          const parsed = JSON.parse(json);
          expect(parsed).toHaveLength(1);
          expect(parsed[0].name).toBe('Test Col');
      });

      it('should import collections from JSON and regenerate IDs', () => {
          const exportData = JSON.stringify([{
              id: 'old-id',
              name: 'Imported Col',
              requests: [{ id: 'req-id', url: 'http://test.com', method: 'GET' }]
          }]);

          const result = store.importCollections(exportData);
          expect(result).toBe(true);
          expect(store.collections).toHaveLength(1);
          expect(store.collections[0].name).toBe('Imported Col');
          expect(store.collections[0].id).not.toBe('old-id');
          expect(store.collections[0].requests[0].id).not.toBe('req-id');
      });

      it('should handle invalid collection import JSON', () => {
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          const result = store.importCollections('invalid');
          expect(result).toBe(false);
          expect(store.collections).toHaveLength(0);
          consoleSpy.mockRestore();
      });

      it('should export environments as JSON', () => {
          store.createEnvironment('Test Env');
          const json = store.exportEnvironments();
          const parsed = JSON.parse(json);
          expect(parsed).toHaveLength(1);
          expect(parsed[0].name).toBe('Test Env');
      });

      it('should import environments from JSON and regenerate IDs', () => {
          const exportData = JSON.stringify([{
              id: 'old-env-id',
              name: 'Imported Env',
              variables: []
          }]);

          const result = store.importEnvironments(exportData);
          expect(result).toBe(true);
          expect(store.environments).toHaveLength(1);
          expect(store.environments[0].name).toBe('Imported Env');
          expect(store.environments[0].id).not.toBe('old-env-id');
      });

      it('should handle invalid environment import JSON', () => {
          const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
          const result = store.importEnvironments('invalid');
          expect(result).toBe(false);
          expect(store.environments).toHaveLength(0);
          consoleSpy.mockRestore();
      });
  });

  describe('Duplicate and Rename', () => {
    it('should duplicate tab', () => {
        store.setUrl('http://dup.com');
        store.setMethod('POST');
        const id = store.activeTabId!;
        store.duplicateTab(id);

        expect(store.tabs).toHaveLength(2);
        // New tab should be active
        expect(store.activeTabId).not.toBe(id);
        expect(store.method).toBe('POST');
        expect(store.url).toBe('http://dup.com');
    });

    it('should not duplicate non-existent tab', () => {
        store.duplicateTab('invalid');
        expect(store.tabs).toHaveLength(1);
    });

    it('should rename collection', () => {
        store.createCollection('Old Name');
        const id = store.collections[0].id;
        store.renameCollection(id, 'New Name');
        expect(store.collections[0].name).toBe('New Name');
    });

    it('should not rename non-existent collection', () => {
        store.renameCollection('invalid', 'New Name');
        expect(store.collections).toHaveLength(0);
    });

    it('should rename request in collection', () => {
        store.createCollection('Col');
        const colId = store.collections[0].id;
        store.saveRequestToCollection(colId, 'Req Old');
        const reqId = store.collections[0].requests[0].id;

        store.renameRequestInCollection(colId, reqId, 'Req New');
        expect(store.collections[0].requests[0].name).toBe('Req New');
    });

    it('should not rename request in non-existent collection', () => {
        store.renameRequestInCollection('invalid', 'id', 'Name');
        expect(store.collections).toHaveLength(0);
    });

    it('should not rename non-existent request', () => {
        store.createCollection('Col');
        const colId = store.collections[0].id;
        store.renameRequestInCollection(colId, 'invalid', 'Name');
        expect(store.collections[0].requests).toHaveLength(0);
    });
  });

  describe('Tab Loading Errors', () => {
      it('should handle invalid JSON in loadTabs', () => {
           localStorage.setItem('requestTabs', 'invalid');
           const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
           store = new RequestStore();
           expect(store.tabs).toHaveLength(1); // Default new tab
           consoleSpy.mockRestore();
      });

      it('should handle savedActiveId logic', () => {
          // Case where active ID is saved but tab doesn't exist
           localStorage.setItem('requestTabs', JSON.stringify([]));
           localStorage.setItem('activeTabId', 'missing');
           store = new RequestStore();
           expect(store.tabs).toHaveLength(1); // Created default
           expect(store.activeTabId).toBe(store.tabs[0].id);
      });
  });
});
