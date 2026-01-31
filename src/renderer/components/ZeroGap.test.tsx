import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { RequestEditor } from './RequestEditor';
import { CodeSnippetModal } from './CodeSnippetModal';
import { requestStore } from '../stores/RequestStore';
import { runInAction, configure } from 'mobx';
import '@testing-library/jest-dom';

configure({ enforceActions: "never" });

// Mock window.electronAPI
const mockMakeRequest = vi.fn();
Object.defineProperty(window, 'electronAPI', {
  value: {
    makeRequest: mockMakeRequest,
    getFilePath: vi.fn((f) => f.name),
    cancelRequest: vi.fn()
  },
  writable: true
});

// Mock alerts/prompts/confirms
global.alert = vi.fn();
global.prompt = vi.fn();
global.confirm = vi.fn();
console.error = vi.fn();

describe('Zero Gap UI Tests', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        runInAction(() => {
            requestStore.collections = [];
            requestStore.environments = [];
            requestStore.history = [];
            requestStore.addTab(); // Ensure at least one tab
        });
    });

    it('RequestEditor: should handle API Key Value change', () => {
        runInAction(() => {
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'my-key', value: '', addTo: 'header' }
            };
            requestStore.activeTab.auth = requestStore.auth; // Sync active tab
        });

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));

        const inputs = screen.getAllByPlaceholderText('Value');
        // The first one in the list of API Key inputs (Key, Value, Add To)
        const valueInput = inputs.find(i => (i as HTMLInputElement).value === '');

        if (valueInput) {
            fireEvent.change(valueInput, { target: { value: 'my-secret-value' } });
            expect(requestStore.auth.apiKey?.value).toBe('my-secret-value');
        } else {
            throw new Error('API Key Value input not found');
        }
    });

    it('RequestEditor: should handle file input change with empty file list', () => {
        runInAction(() => {
            requestStore.bodyType = 'form-data';
            requestStore.bodyFormData = [{ key: 'file', value: '', type: 'file' }];
            requestStore.activeTab.bodyType = 'form-data';
            requestStore.activeTab.bodyFormData = requestStore.bodyFormData;
        });

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));

        // Find the file input (hidden inside the rendered output often, or just by type)
        // Styled components might hide the actual input, but it's there
        const fileInputs = document.querySelectorAll('input[type="file"]');
        expect(fileInputs.length).toBeGreaterThan(0);
        const fileInput = fileInputs[0];

        // Trigger change with empty files
        fireEvent.change(fileInput, { target: { files: [] } });

        // Should not crash, and value should remain empty (or whatever previous state)
        expect(requestStore.bodyFormData[0].value).toBe('');
    });

    it('Sidebar: should handle Import Environment with FileReader null result', () => {
        // Mock FileReader
        const originalFileReader = window.FileReader;
        window.FileReader = class {
            readAsText() {
                if (this.onload) {
                    this.onload({ target: { result: null } } as any);
                }
            }
        } as any;

        const alertSpy = vi.spyOn(window, 'alert');

        render(<Sidebar />);
        fireEvent.click(screen.getByText('Envs'));

        // Find hidden input
        const fileInputs = document.querySelectorAll('input[type="file"]');
        // Environment import is likely the second one if both are rendered?
        // Actually Sidebar renders conditional content.
        // If 'Envs' tab is active, only Env import input is likely rendered or both.
        // Let's find by looking at the container
        // The import button triggers click on input.
        // We can just query input directly.
        // There is only one input visible in DOM when Envs tab is active (ref={envFileInput})

        const envInput = fileInputs[0] as HTMLInputElement; // Assuming only one is rendered or we pick first

        fireEvent.change(envInput, { target: { files: [new File([''], 'env.json')] } });

        // Should not alert success
        expect(alertSpy).not.toHaveBeenCalledWith('Environments imported successfully!');

        window.FileReader = originalFileReader;
    });

    it('Sidebar: should handle Rename Request in Collection', () => {
        runInAction(() => {
            requestStore.collections = [{
                id: 'col-1',
                name: 'My Collection',
                requests: [{
                    id: 'req-1',
                    name: 'Old Name',
                    method: 'GET',
                    url: 'http://example.com',
                    headers: [],
                    date: ''
                }]
            }];
        });

        const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('New Name');

        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        // Find rename button (pencil) for the request
        // RequestInCollection has 2 buttons: Rename and Delete.
        // Rename is the first ActionBtn inside RequestInCollection.
        // We can find by title "Rename Request"
        const renameBtn = screen.getByTitle('Rename Request');
        fireEvent.click(renameBtn);

        expect(promptSpy).toHaveBeenCalledWith('Rename request:', 'Old Name');
        expect(requestStore.collections[0].requests[0].name).toBe('New Name');
    });

    it('CodeSnippetModal: should handle invalid API Key AddTo', () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'k', value: 'v', addTo: 'invalid' as any }
            };
        });

        render(<CodeSnippetModal onClose={() => {}} />);

        // Should verify that key/value are NOT in code
        const textArea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(textArea.value).not.toContain('k: v');
        expect(textArea.value).not.toContain('k=v');
    });
});
