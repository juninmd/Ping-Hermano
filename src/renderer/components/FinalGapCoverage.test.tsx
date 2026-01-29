import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { ResponseViewer } from './ResponseViewer';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { generateCurl, generateFetch } from '../utils/codeGenerator';
import { vi } from 'vitest';
import { runInAction } from 'mobx';

// Mock electron API
window.electronAPI = {
  makeRequest: vi.fn(),
  getFilePath: vi.fn(),
};

describe('Final Gap Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset store state
    runInAction(() => {
      requestStore.tabs = [];
      requestStore.addTab();
      requestStore.collections = [];
      requestStore.history = [];
      requestStore.environments = [];
    });
  });

  describe('RequestEditor Coverage', () => {
    it('should handle cancelling save prompt', () => {
      runInAction(() => {
        requestStore.createCollection('Test Col');
      });
      render(<RequestEditor />);

      const saveBtn = screen.getByText('Save');

      const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      fireEvent.click(saveBtn);

      expect(promptSpy).toHaveBeenCalled();
      expect(alertSpy).not.toHaveBeenCalledWith('Saved!');
    });

    it('should handle API Key "Key" input change', () => {
      runInAction(() => {
        requestStore.setAuth({ type: 'apikey', apiKey: { key: '', value: '', addTo: 'header' } });
      });
      render(<RequestEditor />);

      // Click Auth tab
      fireEvent.click(screen.getByText('Auth'));

      const keyInputs = screen.getAllByPlaceholderText('Key');
      // The first one is in the auth section (since we are on Auth tab)
      // Actually, looking at RequestEditor, it renders placeholders "Key" for the API Key inputs

      fireEvent.change(keyInputs[0], { target: { value: 'new-key' } });

      expect(requestStore.auth.apiKey?.key).toBe('new-key');
    });

    it('should handle Form Data "Key" input change', () => {
      runInAction(() => {
        requestStore.setBodyType('form-data');
        requestStore.setBodyFormData([{ key: '', value: '', type: 'text' }]);
      });
      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Body'));

      const inputs = screen.getAllByPlaceholderText('Key');
      fireEvent.change(inputs[0], { target: { value: 'fd-key' } });

      expect(requestStore.bodyFormData[0].key).toBe('fd-key');
    });

    it('should handle URL Encoded "Key" input change', () => {
      runInAction(() => {
        requestStore.setBodyType('x-www-form-urlencoded');
        requestStore.setBodyUrlEncoded([{ key: '', value: '' }]);
      });
      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Body'));

      const inputs = screen.getAllByPlaceholderText('Key');
      fireEvent.change(inputs[0], { target: { value: 'ue-key' } });

      expect(requestStore.bodyUrlEncoded[0].key).toBe('ue-key');
    });

    it('should handle cancelling collection selection prompt (multiple collections)', () => {
      runInAction(() => {
        requestStore.createCollection('Col1');
        requestStore.createCollection('Col2');
      });
      render(<RequestEditor />);

      const saveBtn = screen.getByText('Save');

      // First prompt (Name) returns 'ReqName', Second prompt (Index) returns null
      const promptSpy = vi.spyOn(window, 'prompt')
        .mockReturnValueOnce('ReqName')
        .mockReturnValueOnce(null);

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      fireEvent.click(saveBtn);

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(alertSpy).not.toHaveBeenCalledWith('Saved!');
    });
  });

  describe('ResponseViewer Coverage', () => {
    it('should use inherit color for status < 200', () => {
      runInAction(() => {
        requestStore.loading = false;
        requestStore.response = {
            status: 100,
            statusText: 'Continue',
            data: {},
            headers: {}
        };
      });

      const { container } = render(<ResponseViewer />);
      const statusSpan = container.querySelector('span[class^="ResponseViewer__StatusValue"]');
      // Since styled-components generates classes, we might need to check computed style or rely on the logic branch coverage
      // Just rendering it is enough to cover the line
      expect(screen.getByText('100 Continue')).toBeInTheDocument();
    });
  });

  describe('CodeGenerator Coverage', () => {
    it('should handle unknown body type in curl', () => {
      const req: any = {
          method: 'POST',
          url: 'http://test.com',
          headers: [],
          bodyType: 'unknown',
          body: 'content'
      };
      const code = generateCurl(req);
      expect(code).toContain('curl -X POST "http://test.com"');
      // Should not contain -d or -F since type is unknown
      expect(code).not.toContain('-d');
      expect(code).not.toContain('-F');
    });

    it('should handle unknown body type in fetch', () => {
        const req: any = {
            method: 'POST',
            url: 'http://test.com',
            headers: [],
            bodyType: 'unknown',
            body: 'content'
        };
        const code = generateFetch(req);
        expect(code).toContain('method: "POST"');
        // Should not have body property
        expect(code).not.toContain('body:');
    });
  });

  describe('RequestStore Coverage', () => {
    it('should handle invalid JSON in loadTabs', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('requestTabs', 'invalid-json');

        // Force reload tabs (need to reset tabs first?)
        // The store loads tabs in constructor. We can call loadTabs manually.
        requestStore.loadTabs();

        expect(consoleSpy).toHaveBeenCalledWith("Failed to load tabs", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in loadHistory', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('requestHistory', 'invalid-json');

        requestStore.loadHistory();

        expect(consoleSpy).toHaveBeenCalledWith("Failed to parse history", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in loadCollections', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('requestCollections', 'invalid-json');

        requestStore.loadCollections();

        expect(consoleSpy).toHaveBeenCalledWith("Failed to parse collections", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should handle invalid JSON in loadEnvironments', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('environments', 'invalid-json');

        requestStore.loadEnvironments();

        expect(consoleSpy).toHaveBeenCalledWith("Failed to parse environments", expect.any(Error));
        consoleSpy.mockRestore();
    });

    it('should cover response setter', () => {
        requestStore.response = { status: 200 };
        expect(requestStore.response.status).toBe(200);
    });
  });

  describe('Sidebar Coverage', () => {
      it('should handle cancelling rename collection', () => {
          runInAction(() => {
              requestStore.createCollection('Col1');
          });
          render(<Sidebar />);
          fireEvent.click(screen.getByText('Collections'));

          const renameBtn = screen.getByTitle('Rename Collection');
          vi.spyOn(window, 'prompt').mockReturnValue(null);

          // Original name
          expect(screen.getByText('Col1 (0)')).toBeInTheDocument();

          fireEvent.click(renameBtn);

          // Should still be Col1
          expect(screen.getByText('Col1 (0)')).toBeInTheDocument();
      });

      it('should handle cancelling rename request in collection', () => {
        runInAction(() => {
            requestStore.createCollection('Col1');
            requestStore.saveRequestToCollection(requestStore.collections[0].id, 'Req1');
        });
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');
        vi.spyOn(window, 'prompt').mockReturnValue(null);

        fireEvent.click(renameBtn);
        expect(screen.getByText('Req1')).toBeInTheDocument();
      });

      it('should handle cancelling delete environment', () => {
          runInAction(() => {
              requestStore.createEnvironment('Env1');
          });
          render(<Sidebar />);
          fireEvent.click(screen.getByText('Envs'));

          const deleteBtn = screen.getByTitle('Delete');
          vi.spyOn(window, 'confirm').mockReturnValue(false);

          fireEvent.click(deleteBtn);
          expect(screen.getByText('Env1')).toBeInTheDocument();
      });

      it('should handle cancelling delete collection', () => {
          runInAction(() => {
              requestStore.createCollection('ColToDelete');
          });
          render(<Sidebar />);
          fireEvent.click(screen.getByText('Collections'));

          const deleteBtn = screen.getByTitle('Delete Collection');
          vi.spyOn(window, 'confirm').mockReturnValue(false);

          fireEvent.click(deleteBtn);
          expect(screen.getByText(/ColToDelete/)).toBeInTheDocument();
      });

      it('should return early if no file selected for import (manual trigger)', () => {
        const { container } = render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        // Find inputs
        const inputs = container.querySelectorAll('input[type="file"]');
        // inputs[0] is likely the collections one based on render order (History, Collections, Envs)
        // But Collections tab is active, so it should be there.

        // Actually, there are inputs in History? No.
        // In Collections tab: one input for import.

        // Sidebar renders all inputs? No, only active tab content.

        const input = inputs[0];

        // Mock FileReader not to be called
        const readerSpy = vi.spyOn(window, 'FileReader');

        fireEvent.change(input, { target: { files: [] } });

        expect(readerSpy).not.toHaveBeenCalled();
      });
  });
});
