import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodeSnippetModal } from './CodeSnippetModal';
import { RequestEditor } from './RequestEditor';
import { ResponseViewer } from './ResponseViewer';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { runInAction, configure } from 'mobx';
import * as codeGenerator from '../utils/codeGenerator';

// Configure MobX
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

describe('Full Coverage Tests', () => {
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
            requestStore.response = null;
            requestStore.loading = false;
            requestStore.error = null;
        });
        localStorageMock.clear();
    });

    // --- CodeSnippetModal & codeGenerator ---
    describe('CodeSnippetModal & codeGenerator', () => {
        it('should copy code to clipboard', () => {
            render(<CodeSnippetModal onClose={() => {}} />);
            fireEvent.click(screen.getByText('Copy'));
            expect(mockWriteText).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith('Copied to clipboard!');
        });

        it('should generate correct code for Basic Auth', () => {
            runInAction(() => {
                requestStore.url = 'http://example.com';
                requestStore.auth = { type: 'basic', username: 'user', password: 'pass' };
            });
            render(<CodeSnippetModal onClose={() => {}} />);
            const codeArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
            expect(codeArea.value).toContain('Authorization: Basic dXNlcjpwYXNz');
        });

        it('should generate correct code for Bearer Token', () => {
             runInAction(() => {
                requestStore.url = 'http://example.com';
                requestStore.auth = { type: 'bearer', token: 'mytoken' };
            });
            render(<CodeSnippetModal onClose={() => {}} />);
            const codeArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
            expect(codeArea.value).toContain('Authorization: Bearer mytoken');
        });

        it('should generate correct code for API Key (Header)', () => {
            runInAction(() => {
                requestStore.url = 'http://example.com';
                requestStore.auth = { type: 'apikey', apiKey: { key: 'X-API-KEY', value: '123', addTo: 'header' } };
            });
            render(<CodeSnippetModal onClose={() => {}} />);
            const codeArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
            expect(codeArea.value).toContain('X-API-KEY: 123');
        });

        it('should generate correct code for API Key (Query)', () => {
            runInAction(() => {
                requestStore.url = 'http://example.com';
                requestStore.auth = { type: 'apikey', apiKey: { key: 'api_key', value: '123', addTo: 'query' } };
            });
            render(<CodeSnippetModal onClose={() => {}} />);
            const codeArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
            expect(codeArea.value).toContain('http://example.com?api_key=123');
        });

         it('should generate correct code for API Key (Query) with existing params', () => {
            runInAction(() => {
                requestStore.url = 'http://example.com?foo=bar';
                requestStore.auth = { type: 'apikey', apiKey: { key: 'api_key', value: '123', addTo: 'query' } };
            });
            render(<CodeSnippetModal onClose={() => {}} />);
            const codeArea = screen.getByRole('textbox', { name: '' }) as HTMLTextAreaElement;
            expect(codeArea.value).toContain('http://example.com?foo=bar&api_key=123');
        });

        it('should switch between curl and fetch', () => {
             render(<CodeSnippetModal onClose={() => {}} />);
             fireEvent.click(screen.getByText('Fetch'));
             const codeArea = screen.getByRole('textbox', { name: '' });
             expect(codeArea.value).toContain('fetch("');

             fireEvent.click(screen.getByText('cURL'));
             expect(codeArea.value).toContain('curl -X');
        });

        // Specific coverage for codeGenerator.ts branches
        it('should generate curl for POST form-data', () => {
            const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'form-data' as const,
                body: '',
                bodyFormData: [{ key: 'field1', value: 'value1' }],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const curl = codeGenerator.generateCurl(reqData);
            expect(curl).toContain('-F "field1=value1"');
        });

         it('should generate curl for POST x-www-form-urlencoded', () => {
            const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'x-www-form-urlencoded' as const,
                body: '',
                bodyFormData: [],
                bodyUrlEncoded: [{ key: 'field1', value: 'value1' }],
                queryParams: []
            };
            const curl = codeGenerator.generateCurl(reqData);
            expect(curl).toContain('--data-urlencode "field1=value1"');
        });

        it('should generate curl for POST JSON with single quotes', () => {
             const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'json' as const,
                body: "{'key': 'val'}",
                bodyFormData: [],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const curl = codeGenerator.generateCurl(reqData);
            // Verify it contains the escaped single quotes
            // Logic: ' -> '\''
            // So "{'key': 'val'}" -> "{'\''key'\'': '\''val'\''}"
            // Wrapped in -d '...'
            const expectedBody = "{'key': 'val'}".replace(/'/g, "'\\''");
            expect(curl).toContain(`-d '${expectedBody}'`);
        });

        it('should generate fetch for POST form-data', () => {
             const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'form-data' as const,
                body: '',
                bodyFormData: [{ key: 'field1', value: 'value1' }],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const fetchCode = codeGenerator.generateFetch(reqData);
            expect(fetchCode).toContain('const formdata = new FormData();');
            expect(fetchCode).toContain('formdata.append("field1", "value1");');
            expect(fetchCode).toContain('body: formdata');
        });

         it('should generate fetch for POST x-www-form-urlencoded', () => {
             const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'x-www-form-urlencoded' as const,
                body: '',
                bodyFormData: [],
                bodyUrlEncoded: [{ key: 'field1', value: 'value1' }],
                queryParams: []
            };
            const fetchCode = codeGenerator.generateFetch(reqData);
            expect(fetchCode).toContain('body: new URLSearchParams([["field1","value1"]])');
        });

        it('should generate fetch for POST JSON (formatted)', () => {
             const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'json' as const,
                body: '{\n  "a": 1\n}',
                bodyFormData: [],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const fetchCode = codeGenerator.generateFetch(reqData);
            // It uses JSON.stringify(obj, null, 2) which adds newlines and spaces
            expect(fetchCode).toContain('body: JSON.stringify({');
            expect(fetchCode).toContain('"a": 1');
        });

        it('should generate fetch for POST invalid JSON (raw)', () => {
             const reqData = {
                method: 'POST',
                url: 'http://example.com',
                headers: [],
                bodyType: 'json' as const,
                body: '{ invalid }',
                bodyFormData: [],
                bodyUrlEncoded: [],
                queryParams: []
            };
            const fetchCode = codeGenerator.generateFetch(reqData);
            expect(fetchCode).toContain('body: "{ invalid }"');
        });
    });

    // --- RequestEditor ---
    describe('RequestEditor', () => {
        it('should handle form-data editor interactions', () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));
            fireEvent.click(screen.getByLabelText('Form Data'));

            // Initial row should be present
            const keyInputs = screen.getAllByPlaceholderText('Key');
            expect(keyInputs).toHaveLength(1);

            // Add new row by typing
            fireEvent.change(keyInputs[0], { target: { value: 'key1' } });
            fireEvent.change(screen.getAllByPlaceholderText('Value')[0], { target: { value: 'val1' } });

            // Should add a new empty row
            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(2);

            // Remove row
            const removeBtns = screen.getAllByRole('button', { name: '✕' });
            fireEvent.click(removeBtns[0]);

            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(1);
        });

        it('should handle x-www-form-urlencoded editor interactions', () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));
            fireEvent.click(screen.getByLabelText('x-www-form-urlencoded'));

             // Initial row should be present
            const keyInputs = screen.getAllByPlaceholderText('Key');
            expect(keyInputs).toHaveLength(1);

            // Add new row by typing
            fireEvent.change(keyInputs[0], { target: { value: 'key1' } });

            // Should add a new empty row
            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(2);

            // Remove row
            const removeBtns = screen.getAllByRole('button', { name: '✕' });
            fireEvent.click(removeBtns[0]);

            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(1);
        });

        it('should cancel saving request if name prompt is cancelled', () => {
            runInAction(() => {
                requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
            });
            (global.prompt as any).mockReturnValue(null);

            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.collections[0].requests).toHaveLength(0);
        });

        it('should save request to specific collection when multiple exist', () => {
            runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] },
                    { id: '2', name: 'Col2', requests: [] }
                ];
                requestStore.url = 'http://test.com';
                requestStore.method = 'GET';
            });

            // First prompt: Name, Second prompt: Index
            (global.prompt as any)
                .mockReturnValueOnce('My Request')
                .mockReturnValueOnce('1'); // Select Col2 (index 1)

            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Save'));

            expect(global.alert).toHaveBeenCalledWith('Saved!');
            expect(requestStore.collections[1].requests).toHaveLength(1);
            expect(requestStore.collections[1].requests[0].name).toBe('My Request');
        });

        it('should alert if no collections exist when saving', () => {
            runInAction(() => {
                requestStore.collections = [];
            });
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Save'));
            expect(global.alert).toHaveBeenCalledWith('Create a collection first!');
        });
    });

    // --- ResponseViewer ---
    describe('ResponseViewer', () => {
        it('should format null body', () => {
            runInAction(() => {
                requestStore.response = { data: null, status: 200, headers: {} };
            });
            render(<ResponseViewer />);
            const bodyArea = screen.getByRole('textbox', { name: '' });
            expect(bodyArea).toHaveValue('');
        });

         it('should format object body', () => {
            runInAction(() => {
                requestStore.response = { data: { foo: 'bar' }, status: 200, headers: {} };
            });
            render(<ResponseViewer />);
            const bodyArea = screen.getByRole('textbox', { name: '' });
            expect(bodyArea).toHaveValue('{\n  "foo": "bar"\n}');
        });

        it('should format valid JSON string body', () => {
             runInAction(() => {
                requestStore.response = { data: '{"foo": "bar"}', status: 200, headers: {} };
            });
            render(<ResponseViewer />);
            const bodyArea = screen.getByRole('textbox', { name: '' });
            expect(bodyArea).toHaveValue('{\n  "foo": "bar"\n}');
        });

        it('should format invalid JSON string body', () => {
             runInAction(() => {
                requestStore.response = { data: 'invalid json', status: 200, headers: {} };
            });
            render(<ResponseViewer />);
            const bodyArea = screen.getByRole('textbox', { name: '' });
            expect(bodyArea).toHaveValue('invalid json');
        });

        it('should format number body', () => {
             runInAction(() => {
                requestStore.response = { data: 123, status: 200, headers: {} };
            });
            render(<ResponseViewer />);
            const bodyArea = screen.getByRole('textbox', { name: '' });
            expect(bodyArea).toHaveValue('123');
        });
    });

    // --- Sidebar ---
    describe('Sidebar', () => {
        it('should not clear history if cancelled', () => {
            runInAction(() => {
                requestStore.history = [{ id: '1', method: 'GET', url: 'http://test.com', date: '' }];
            });
            (global.confirm as any).mockReturnValue(false);

            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));

            expect(requestStore.history).toHaveLength(1);
        });

        it('should not delete collection if cancelled', () => {
             runInAction(() => {
                requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
            });
            (global.confirm as any).mockReturnValue(false);

            render(<Sidebar />);
            fireEvent.click(screen.getByText('Collections'));

            // Find the delete button for the collection
            const collectionHeader = screen.getByText(/Col1/).closest('div');
            const deleteBtn = collectionHeader?.querySelector('button');
            fireEvent.click(deleteBtn!);

            expect(requestStore.collections).toHaveLength(1);
        });

        it('should not delete environment if cancelled', () => {
             runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Env1', variables: [] }];
            });
            (global.confirm as any).mockReturnValue(false);

            render(<Sidebar />);
            fireEvent.click(screen.getByText('Envs'));
            fireEvent.click(screen.getByTitle('Delete'));

            expect(requestStore.environments).toHaveLength(1);
        });

        it('should not create collection if name prompt cancelled', () => {
            (global.prompt as any).mockReturnValue(null);
            render(<Sidebar />);
            fireEvent.click(screen.getByText('Collections'));
            fireEvent.click(screen.getByTitle('New Collection'));

            expect(requestStore.collections).toHaveLength(0);
        });

         it('should not create environment if name prompt cancelled', () => {
            (global.prompt as any).mockReturnValue(null);
            render(<Sidebar />);
            fireEvent.click(screen.getByText('Envs'));
            fireEvent.click(screen.getByTitle('New Environment'));

            expect(requestStore.environments).toHaveLength(0);
        });

        it('should handle collection import failure', async () => {
             render(<Sidebar />);
             fireEvent.click(screen.getByText('Collections'));

             const fileInput = screen.getByTitle('Import Collections').parentElement!.querySelector('input[type="file"]')!;

             // Create invalid file
             const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
             fireEvent.change(fileInput, { target: { files: [file] } });

             // Wait for FileReader
             await waitFor(() => {
                 expect(global.alert).toHaveBeenCalledWith('Failed to import collections. Invalid format?');
             });
        });

        it('should handle environment import failure', async () => {
             render(<Sidebar />);
             fireEvent.click(screen.getByText('Envs'));

             const fileInput = screen.getByTitle('Import Environments').parentElement!.querySelector('input[type="file"]')!;

             const file = new File(['invalid json'], 'test.json', { type: 'application/json' });
             fireEvent.change(fileInput, { target: { files: [file] } });

             await waitFor(() => {
                 expect(global.alert).toHaveBeenCalledWith('Failed to import environments. Invalid format?');
             });
        });

        it('should clear history when confirmed', () => {
             runInAction(() => {
                requestStore.history = [{ id: '1', method: 'GET', url: 'http://test.com', date: '' }];
            });
            (global.confirm as any).mockReturnValue(true);

            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));

            expect(requestStore.history).toHaveLength(0);
        });

        it('should delete collection when confirmed', () => {
             runInAction(() => {
                requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
            });
            (global.confirm as any).mockReturnValue(true);

            render(<Sidebar />);
            fireEvent.click(screen.getByText('Collections'));

            const collectionHeader = screen.getByText(/Col1/).closest('div');
            const deleteBtn = collectionHeader?.querySelector('button');
            fireEvent.click(deleteBtn!);

            expect(requestStore.collections).toHaveLength(0);
        });

        it('should delete environment when confirmed', () => {
             runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Env1', variables: [] }];
            });
            (global.confirm as any).mockReturnValue(true);

            render(<Sidebar />);
            fireEvent.click(screen.getByText('Envs'));
            fireEvent.click(screen.getByTitle('Delete'));

            expect(requestStore.environments).toHaveLength(0);
        });
    });

    // --- RequestStore Edge Cases ---
    describe('RequestStore Edge Cases', () => {
        it('should handle corrupted localStorage for collections', () => {
             localStorageMock.setItem('requestCollections', 'invalid json');
             const consoleSpy = vi.spyOn(console, 'error');
             requestStore.loadCollections();
             expect(consoleSpy).toHaveBeenCalledWith("Failed to parse collections", expect.any(Error));
        });

        it('should handle corrupted localStorage for environments', () => {
             localStorageMock.setItem('environments', 'invalid json');
             const consoleSpy = vi.spyOn(console, 'error');
             requestStore.loadEnvironments();
             expect(consoleSpy).toHaveBeenCalledWith("Failed to parse environments", expect.any(Error));
        });

         it('should handle corrupted localStorage for history', () => {
             localStorageMock.setItem('requestHistory', 'invalid json');
             const consoleSpy = vi.spyOn(console, 'error');
             requestStore.loadHistory();
             expect(consoleSpy).toHaveBeenCalledWith("Failed to parse history", expect.any(Error));
        });

        it('should return false on importCollections error', () => {
            const result = requestStore.importCollections('invalid json');
            expect(result).toBe(false);
        });

        it('should return false on importEnvironments error', () => {
            const result = requestStore.importEnvironments('invalid json');
            expect(result).toBe(false);
        });

        it('should update Content-Type header when switching body types', () => {
            runInAction(() => {
                requestStore.headers = [{ key: 'Content-Type', value: 'old/type' }];
            });

            // Switch to JSON
            runInAction(() => requestStore.setBodyType('json'));
            expect(requestStore.headers[0].value).toBe('application/json');

            // Switch to x-www-form-urlencoded
            runInAction(() => requestStore.setBodyType('x-www-form-urlencoded'));
            expect(requestStore.headers[0].value).toBe('application/x-www-form-urlencoded');

            // Switch to text (should remove it)
             runInAction(() => requestStore.setBodyType('text'));
            // Since we had Content-Type, it should be filtered out.
            // But we always ensure an empty row at the end.
            expect(requestStore.headers).toHaveLength(1);
            expect(requestStore.headers[0].key).toBe('');
        });

        it('should handle parsing empty query params', () => {
             runInAction(() => {
                 requestStore.url = 'http://example.com?';
                 requestStore.queryParams = [{ key: 'a', value: '1' }]; // old params
             });
             // Calling setUrl triggers parseQueryParams
             runInAction(() => requestStore.setUrl('http://example.com?'));

             // Should reset to empty row
             expect(requestStore.queryParams).toHaveLength(1);
             expect(requestStore.queryParams[0].key).toBe('');
        });

        it('should handle parsing url with no search part but existing params', () => {
             runInAction(() => {
                 requestStore.queryParams = [{ key: 'a', value: '1' }, {key: '', value: ''}];
                 requestStore.url = 'http://example.com';
             });

             // This method is private, but called by setUrl.
             // setUrl('http://example.com')
             runInAction(() => requestStore.setUrl('http://example.com'));

             expect(requestStore.queryParams).toHaveLength(1);
             expect(requestStore.queryParams[0].key).toBe('');
        });

        it('should add Content-Type header when headers are empty', () => {
             runInAction(() => {
                 requestStore.headers = [];
             });
             runInAction(() => requestStore.setBodyType('json'));
             expect(requestStore.headers).toHaveLength(2); // content-type + empty row
             expect(requestStore.headers[0].key).toBe('Content-Type');
        });
    });
});
