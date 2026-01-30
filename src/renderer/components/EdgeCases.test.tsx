import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Sidebar } from './Sidebar';
import { CodeSnippetModal } from './CodeSnippetModal';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

// Mock electronAPI
window.electronAPI = {
  makeRequest: vi.fn(),
  getFilePath: vi.fn((f) => f.name),
  cancelRequest: vi.fn()
};

describe('Edge Cases', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    runInAction(() => {
        requestStore.collections = [];
        requestStore.environments = [];
        requestStore.tabs = [];
        requestStore.addTab();
    });
  });

  // 1. Sidebar FileReader Error
  test('Sidebar: should handle FileReader returning null result', async () => {
    // Mock FileReader
    const originalFileReader = window.FileReader;
    window.FileReader = class {
      readAsText() {
        // trigger onload with null result
        if (this.onload) {
          this.onload({ target: { result: null } } as any);
        }
      }
    } as any;

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<Sidebar />);
    fireEvent.click(screen.getByText('Collections'));

    // Find the hidden input
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const fileInput = fileInputs[0] as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [new File([''], 'test.json')] } });

    // Should not alert success
    expect(alertSpy).not.toHaveBeenCalledWith('Collections imported successfully!');

    window.FileReader = originalFileReader;
    alertSpy.mockRestore();
  });

  // 2. CodeSnippetModal API Key
  test('CodeSnippetModal: should handle API Key in Query', () => {
    runInAction(() => {
        requestStore.url = 'http://api.com';
        requestStore.auth = {
            type: 'apikey',
            apiKey: { key: 'api_key', value: '123', addTo: 'query' }
        };
    });

    render(<CodeSnippetModal onClose={() => {}} />);

    const textArea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textArea.value).toContain('http://api.com?api_key=123');
  });

  test('CodeSnippetModal: should handle API Key in Header', () => {
    runInAction(() => {
        requestStore.url = 'http://api.com';
        requestStore.auth = {
            type: 'apikey',
            apiKey: { key: 'X-API-KEY', value: '123', addTo: 'header' }
        };
    });

    render(<CodeSnippetModal onClose={() => {}} />);

    const textArea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textArea.value).toContain('X-API-KEY: 123');
  });

  // 3. RequestEditor Multiple Collections
  test('RequestEditor: should prompt for collection index if multiple exist', async () => {
    runInAction(() => {
        requestStore.collections = [
            { id: 'c1', name: 'Col 1', requests: [] },
            { id: 'c2', name: 'Col 2', requests: [] }
        ];
    });

    const promptSpy = vi.spyOn(window, 'prompt')
        .mockReturnValueOnce('My Request') // Name
        .mockReturnValueOnce('1'); // Index

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<RequestEditor />);

    fireEvent.click(screen.getByText('Save'));

    expect(promptSpy).toHaveBeenCalledTimes(2);
    expect(requestStore.collections[1].requests).toHaveLength(1);
    expect(requestStore.collections[1].requests[0].name).toBe('My Request');

    promptSpy.mockRestore();
    alertSpy.mockRestore();
  });

  test('RequestEditor: should handle invalid collection index', async () => {
      runInAction(() => {
          requestStore.collections = [
              { id: 'c1', name: 'Col 1', requests: [] },
              { id: 'c2', name: 'Col 2', requests: [] }
          ];
      });

      const promptSpy = vi.spyOn(window, 'prompt')
          .mockReturnValueOnce('My Request') // Name
          .mockReturnValueOnce('99'); // Index (Invalid)

      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Save'));

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(requestStore.collections[0].requests).toHaveLength(0);
      expect(requestStore.collections[1].requests).toHaveLength(0);

      promptSpy.mockRestore();
    });

    test('RequestEditor: should handle cancel collection selection', async () => {
      runInAction(() => {
          requestStore.collections = [
              { id: 'c1', name: 'Col 1', requests: [] },
              { id: 'c2', name: 'Col 2', requests: [] }
          ];
      });

      const promptSpy = vi.spyOn(window, 'prompt')
          .mockReturnValueOnce('My Request') // Name
          .mockReturnValueOnce(null); // Cancel

      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Save'));

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(requestStore.collections[0].requests).toHaveLength(0);
      expect(requestStore.collections[1].requests).toHaveLength(0);

      promptSpy.mockRestore();
    });

  // 4. RequestStore loadTabs Error
  test('RequestStore: should handle loadTabs error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

    getItemSpy.mockImplementation((key) => {
        if (key === 'requestTabs') return 'invalid-json';
        return null;
    });

    // We need to re-instantiate store or call loadTabs
    requestStore.loadTabs();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load tabs', expect.any(Error));

    consoleSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  test('RequestStore: cancelRequest should handle errors', async () => {
    // Mock electronAPI.cancelRequest to throw
    const originalCancel = window.electronAPI.cancelRequest;
    (window.electronAPI.cancelRequest as any) = vi.fn().mockRejectedValue(new Error('Cancel failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    runInAction(() => {
        requestStore.activeTab.loading = true;
        requestStore.activeTab.activeRequestId = 'req-1';
    });

    await requestStore.cancelRequest();

    expect(consoleSpy).toHaveBeenCalledWith('Failed to cancel', expect.any(Error));
    expect(requestStore.loading).toBe(false);
    expect(requestStore.response.statusText).toBe('Cancelled');

    (window.electronAPI.cancelRequest as any) = originalCancel;
    consoleSpy.mockRestore();
  });
});
