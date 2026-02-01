import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { requestStore } from '../stores/RequestStore';
import { CodeSnippetModal } from './CodeSnippetModal';
import { RequestEditor } from './RequestEditor';
import { Sidebar } from './Sidebar';
import { runInAction } from 'mobx';

// Mock electron API
const mockMakeRequest = vi.fn();
const mockGetFilePath = vi.fn();

window.electronAPI = {
  makeRequest: mockMakeRequest,
  cancelRequest: vi.fn(),
  getFilePath: mockGetFilePath,
  on: vi.fn(),
  off: vi.fn()
};

// Mock alert/prompt/confirm
global.alert = vi.fn();
global.prompt = vi.fn();
global.confirm = vi.fn();

describe('Extra Coverage Components', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset store state
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.addTab();
            requestStore.collections = [];
            requestStore.environments = [];
        });
    });

    describe('CodeSnippetModal', () => {
        it('should handle API Key in Query when URL already has query params', async () => {
            runInAction(() => {
                requestStore.url = 'https://api.example.com/data?foo=bar';
                requestStore.auth = {
                    type: 'apikey',
                    apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
                };
            });

            render(<CodeSnippetModal onClose={vi.fn()} />);

            // Check if the generated URL contains &api_key=12345
            // The modal renders a textarea with the code
            const codeArea = screen.getByRole('textbox');
            expect(codeArea).toBeInTheDocument();
            expect(codeArea.textContent).toContain('https://api.example.com/data?foo=bar&api_key=12345');
        });
    });

    describe('RequestEditor', () => {
        it('should remove header', async () => {
            runInAction(() => {
                requestStore.headers = [
                    { key: 'Header1', value: 'Value1' },
                    { key: 'Header2', value: 'Value2' }
                ];
            });

            render(<RequestEditor />);

            // Click "Headers" tab
            fireEvent.click(screen.getByText(/Headers/));

            // Add an empty one manually to simulate real state (RequestStore logic adds it on change)
            runInAction(() => {
                requestStore.headers.push({ key: '', value: '' });
            });

            // Now we have 3 headers. Index 0 and 1 should have remove buttons.
            const removeButtons = screen.getAllByText('✕');
            expect(removeButtons.length).toBeGreaterThan(0);

            // Click the first one
            fireEvent.click(removeButtons[0]);

            // Should remove Header1
            expect(requestStore.headers.length).toBe(2);
            expect(requestStore.headers[0].key).toBe('Header2');
        });

        it('should remove form data', async () => {
             runInAction(() => {
                requestStore.bodyType = 'form-data';
                requestStore.bodyFormData = [
                    { key: 'field1', value: 'value1' },
                    { key: 'field2', value: 'value2' },
                    { key: '', value: '', type: 'text' } // Placeholder
                ];
            });

            render(<RequestEditor />);

            // Click "Body" tab
            fireEvent.click(screen.getByText('Body'));

            // Click "Form Data" radio
            // It's already set in store, but tab content rendering depends on activeTab state in component
            // activeTab defaults to 'params'. So we need to click Body tab.

            // Find remove buttons
            const removeButtons = screen.getAllByText('✕');

            // Click the first one
            fireEvent.click(removeButtons[0]);

            expect(requestStore.bodyFormData.length).toBe(2);
            expect(requestStore.bodyFormData[0].key).toBe('field2');
        });

        it('should handle save with multiple collections', async () => {
            runInAction(() => {
                requestStore.createCollection('Collection 1');
                requestStore.createCollection('Collection 2');
            });

            // Mock prompt to return name "My Request", then return index "1"
            (global.prompt as any)
                .mockReturnValueOnce('My Request') // Name
                .mockReturnValueOnce('1');        // Collection Index

            render(<RequestEditor />);

            fireEvent.click(screen.getByText('Save'));

            expect(global.prompt).toHaveBeenCalledTimes(2);
            expect(requestStore.collections[1].requests.length).toBe(1);
            expect(requestStore.collections[1].requests[0].name).toBe('My Request');
        });

        it('should not save if collection selection is cancelled (returns null)', async () => {
             runInAction(() => {
                requestStore.createCollection('Collection 1');
                requestStore.createCollection('Collection 2');
            });

            // Mock prompt to return name, then null for index
            (global.prompt as any)
                .mockReturnValueOnce('My Request')
                .mockReturnValueOnce(null);

            render(<RequestEditor />);

            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.collections[0].requests.length).toBe(0);
            expect(requestStore.collections[1].requests.length).toBe(0);
        });

         it('should not save if collection selection is invalid index', async () => {
             runInAction(() => {
                requestStore.createCollection('Collection 1');
                requestStore.createCollection('Collection 2');
            });

            // Mock prompt to return name, then invalid index
            (global.prompt as any)
                .mockReturnValueOnce('My Request')
                .mockReturnValueOnce('99');

            render(<RequestEditor />);

            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.collections[0].requests.length).toBe(0);
            expect(requestStore.collections[1].requests.length).toBe(0);
        });
    });

    describe('Sidebar', () => {
        it('should handle environment import interaction', async () => {
             render(<Sidebar />);

             // Switch to Environments tab
             fireEvent.click(screen.getByText('Envs'));

             // Mock FileReader
             const file = new File(['[{"id":"1","name":"Env1","variables":[]}]'], 'envs.json', { type: 'application/json' });

             // The input is hidden.
             // Wait, since we switched tabs, the collections input is unmounted!
             // So there is only ONE input now.
             const inputs = document.querySelectorAll('input[type="file"]');
             const envInput = inputs[0];

             // Trigger change
             fireEvent.change(envInput, { target: { files: [file] } });

             // Wait for file reader
             await waitFor(() => {
                 expect(requestStore.environments.length).toBeGreaterThan(0);
                 expect(requestStore.environments.find(e => e.name === 'Env1')).toBeDefined();
             });
        });
    });

});
