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
        // Not easy to cause URLSearchParams to throw, but good to have safeguard
        // Let's try malformed encoding
        const badUrl = 'https://example.com?a=%E0%A4%A';
        store.setUrl(badUrl);
        // Should not crash
        expect(store.url).toBe(badUrl);
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
              auth: { type: 'basic', username: 'u', password: 'p' },
              preRequestScript: 'pre',
              testScript: 'test',
              date: 'now'
          };
          store.loadHistoryItem(item);
          expect(store.method).toBe('POST');
          expect(store.url).toBe('http://load.com');
          expect(store.headers).toHaveLength(2); // h1 + empty
          expect(store.body).toBe('b');
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
});
