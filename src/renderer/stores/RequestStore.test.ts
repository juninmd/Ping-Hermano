import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { requestStore } from './RequestStore';

// Mock window.electronAPI
const mockMakeRequest = vi.fn();

Object.defineProperty(window, 'electronAPI', {
  value: {
    makeRequest: mockMakeRequest
  },
  writable: true
});

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('RequestStore', () => {
  beforeEach(() => {
    // Reset store state
    requestStore.method = 'GET';
    requestStore.url = '';
    requestStore.headers = [{ key: '', value: '' }];
    requestStore.queryParams = [{ key: '', value: '' }];
    requestStore.body = '';
    requestStore.auth = { type: 'none' };
    requestStore.response = null;
    requestStore.loading = false;
    requestStore.error = null;
    requestStore.history = [];

    vi.clearAllMocks();
  });

  it('should set method', () => {
    requestStore.setMethod('POST');
    expect(requestStore.method).toBe('POST');
  });

  it('should set url and parse query params', () => {
    requestStore.setUrl('https://api.example.com?foo=bar&baz=qux');
    expect(requestStore.url).toBe('https://api.example.com?foo=bar&baz=qux');
    expect(requestStore.queryParams).toEqual([
      { key: 'foo', value: 'bar' },
      { key: 'baz', value: 'qux' },
      { key: '', value: '' }
    ]);
  });

  it('should update url when query params change', () => {
    requestStore.setUrl('https://api.example.com');
    requestStore.setQueryParams([
        { key: 'foo', value: 'bar' },
        { key: '', value: '' }
    ]);
    expect(requestStore.url).toBe('https://api.example.com?foo=bar');
  });

  it('should set auth header for Basic Auth', () => {
    requestStore.setAuth({ type: 'basic', username: 'user', password: 'pass' });
    const authHeader = requestStore.headers.find(h => h.key === 'Authorization');
    expect(authHeader).toBeDefined();
    expect(authHeader?.value).toBe('Basic ' + btoa('user:pass'));
  });

  it('should set auth header for Bearer Token', () => {
    requestStore.setAuth({ type: 'bearer', token: 'secret-token' });
    const authHeader = requestStore.headers.find(h => h.key === 'Authorization');
    expect(authHeader).toBeDefined();
    expect(authHeader?.value).toBe('Bearer secret-token');
  });

  it('should add request to history', () => {
    requestStore.setMethod('GET');
    requestStore.setUrl('https://api.example.com/history');
    requestStore.addToHistory();

    expect(requestStore.history.length).toBe(1);
    expect(requestStore.history[0].url).toBe('https://api.example.com/history');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should send request and handle success', async () => {
    requestStore.setUrl('https://api.example.com/test');

    mockMakeRequest.mockResolvedValueOnce({
      status: 200,
      data: { success: true },
      headers: {}
    });

    await requestStore.sendRequest();

    expect(requestStore.loading).toBe(false);
    expect(requestStore.response).toEqual({
      status: 200,
      data: { success: true },
      headers: {}
    });
    expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
        url: 'https://api.example.com/test',
        method: 'GET'
    }));
  });

  it('should send request and handle error', async () => {
    requestStore.setUrl('https://api.example.com/error');

    mockMakeRequest.mockRejectedValueOnce(new Error('Network Error'));

    await requestStore.sendRequest();

    expect(requestStore.loading).toBe(false);
    expect(requestStore.response.status).toBe(0);
    expect(requestStore.response.data).toBe('Network Error');
  });
});
