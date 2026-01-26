import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { generateCurl, generateFetch } from '../utils/codeGenerator';
import { ResponseViewer } from './ResponseViewer';
import { runInAction, configure } from 'mobx';
import '@testing-library/jest-dom';

configure({ enforceActions: "never" });

// Mock window.electronAPI
const mockMakeRequest = vi.fn();
Object.defineProperty(window, 'electronAPI', {
  value: {
    makeRequest: mockMakeRequest
  },
  writable: true
});

// Mock localStorage
const localStorageMock = (() => {
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
    }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock clipboard
const mockWriteText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: mockWriteText
  },
  writable: true
});

// Mock alerts/prompts/confirms
global.alert = vi.fn();
global.prompt = vi.fn();
global.confirm = vi.fn();
console.error = vi.fn();

describe('Coverage Final - UI Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = '';
            requestStore.headers = [{ key: '', value: '' }];
            requestStore.queryParams = [{ key: '', value: '' }];
            requestStore.body = '';
            requestStore.bodyFormData = [{ key: '', value: '', type: 'text' }];
            requestStore.bodyUrlEncoded = [{ key: '', value: '' }];
            requestStore.bodyType = 'text';
            requestStore.auth = { type: 'none' };
            requestStore.collections = [];
            requestStore.environments = [];
            requestStore.history = [];
            requestStore.preRequestScript = '';
            requestStore.testScript = '';
            requestStore.loading = false;
            requestStore.response = null;
            requestStore.error = null;
        });
        localStorageMock.clear();
    });

    describe('Sidebar Method Badges', () => {
        it('should render correct colors for different methods', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'POST', url: 'u1', date: '' },
                    { id: '2', method: 'PUT', url: 'u2', date: '' },
                    { id: '3', method: 'DELETE', url: 'u3', date: '' },
                    { id: '4', method: 'PATCH', url: 'u4', date: '' },
                    { id: '5', method: 'OPTIONS', url: 'u5', date: '' }, // default case
                ];
            });
            render(<Sidebar />);
            expect(screen.getByText('POST')).toBeInTheDocument();
            expect(screen.getByText('PUT')).toBeInTheDocument();
            expect(screen.getByText('DELETE')).toBeInTheDocument();
            expect(screen.getByText('PATCH')).toBeInTheDocument();
            expect(screen.getByText('OPTIONS')).toBeInTheDocument();
        });
    });

    describe('RequestEditor Tabs', () => {
        it('should switch to Pre-req tab and edit script', () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Pre-req'));
            const editor = screen.getByPlaceholderText('// Write your pre-request script here');
            fireEvent.change(editor, { target: { value: 'console.log("pre")' } });
            expect(requestStore.preRequestScript).toBe('console.log("pre")');
        });

        it('should switch to Tests tab and edit script', () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Tests'));
            const editor = screen.getByPlaceholderText(/\/\/ Write your tests here/);
            fireEvent.change(editor, { target: { value: 'pm.test()' } });
            expect(requestStore.testScript).toBe('pm.test()');
        });
    });

    describe('RequestEditor x-www-form-urlencoded removal', () => {
        it('should remove x-www-form-urlencoded item', () => {
             runInAction(() => {
                 requestStore.bodyType = 'x-www-form-urlencoded';
                 requestStore.bodyUrlEncoded = [
                     { key: 'k1', value: 'v1' },
                     { key: '', value: '' }
                 ];
             });
             render(<RequestEditor />);
             fireEvent.click(screen.getByText('Body'));

             const removeBtns = screen.getAllByRole('button', { name: '✕' });
             expect(removeBtns).toHaveLength(1);
             fireEvent.click(removeBtns[0]);

             expect(requestStore.bodyUrlEncoded).toHaveLength(1);
             expect(requestStore.bodyUrlEncoded[0].key).toBe('');
        });
    });

    describe('RequestStore Edge Cases', () => {
        it('should handle sendRequest failure', async () => {
             runInAction(() => {
                 requestStore.url = 'http://fail.com';
             });
             mockMakeRequest.mockRejectedValue(new Error('Network Error'));

             await requestStore.sendRequest();

             expect(requestStore.loading).toBe(false);
             expect(requestStore.response).toEqual({
                 status: 0,
                 statusText: 'Error',
                 data: 'Network Error',
                 headers: {}
             });
        });

        it('should handle sendRequest with API Key (Header)', async () => {
             runInAction(() => {
                 requestStore.url = 'http://api.com';
                 requestStore.auth = { type: 'apikey', apiKey: { key: 'X-Key', value: '123', addTo: 'header' } };
             });
             mockMakeRequest.mockResolvedValue({ data: 'ok' });

             await requestStore.sendRequest();

             expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
                 headers: expect.arrayContaining([{ key: 'X-Key', value: '123' }])
             }));
        });

        it('should handle sendRequest with API Key (Query)', async () => {
             runInAction(() => {
                 requestStore.url = 'http://api.com';
                 requestStore.auth = { type: 'apikey', apiKey: { key: 'k', value: 'v', addTo: 'query' } };
             });
             mockMakeRequest.mockResolvedValue({ data: 'ok' });

             await requestStore.sendRequest();

             expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
                 url: 'http://api.com?k=v'
             }));
        });

         it('should handle sendRequest with API Key (Query) appending to existing params', async () => {
             runInAction(() => {
                 requestStore.url = 'http://api.com?a=1';
                 requestStore.auth = { type: 'apikey', apiKey: { key: 'k', value: 'v', addTo: 'query' } };
             });
             mockMakeRequest.mockResolvedValue({ data: 'ok' });

             await requestStore.sendRequest();

             expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
                 url: 'http://api.com?a=1&k=v'
             }));
        });

        it('should save environment correctly (coverage for createEnvironment)', () => {
             requestStore.createEnvironment('NewEnv');
             expect(requestStore.environments).toHaveLength(1);
             expect(requestStore.environments[0].name).toBe('NewEnv');
        });

    });

    describe('CodeGenerator Edge Cases', () => {
        it('should generate curl for POST with empty body', () => {
            const req = {
                method: 'POST',
                url: 'http://e.com',
                headers: [],
                bodyType: 'text' as const,
                body: '',
                bodyFormData: [],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const code = generateCurl(req);
            expect(code).not.toContain('-d');
        });

        it('should generate fetch for POST with empty body', () => {
             const req = {
                method: 'POST',
                url: 'http://e.com',
                headers: [],
                bodyType: 'text' as const,
                body: '',
                bodyFormData: [],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const code = generateFetch(req);
            expect(code).not.toContain('body:');
        });
    });

    describe('ResponseViewer Edge Cases', () => {
        it('should handle stringify error in formatBody', () => {
             const originalStringify = JSON.stringify;
             JSON.stringify = vi.fn((obj, replacer, space) => {
                 // The component calls JSON.stringify(content, null, 2)
                 // We want to throw only for our specific object
                 // MobX wraps objects, so checking property might need access
                 if (obj && obj.throwMe) throw new Error('Stringify error');
                 // Also handle the case where it's called internally by React/Vitest?
                 try {
                    return originalStringify(obj, replacer, space);
                 } catch (e) {
                     // Fallback
                     return String(obj);
                 }
             }) as any;

             const obj = { throwMe: true, toString: () => 'MyString' };

             runInAction(() => {
                 requestStore.response = { data: obj, status: 200, headers: {} };
             });
             render(<ResponseViewer />);
             expect(screen.getByRole('textbox', { name: '' })).toHaveValue('MyString');

             JSON.stringify = originalStringify;
        });
    });
});
