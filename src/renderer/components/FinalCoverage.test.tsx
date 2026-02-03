import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { RequestEditor } from './RequestEditor';
import { requestStore, RequestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

// Mock window.prompt and confirm
const originalPrompt = window.prompt;
const originalAlert = window.alert;

describe('Final Coverage Tests', () => {
  beforeEach(() => {
    window.prompt = originalPrompt;
    window.alert = originalAlert;

    // Reset store
    runInAction(() => {
      requestStore.collections = [];
      requestStore.environments = [];
      requestStore.tabs = [];
      requestStore.addTab(); // Ensure one tab
    });
  });

  afterAll(() => {
    window.prompt = originalPrompt;
    window.alert = originalAlert;
  });

  describe('Sidebar', () => {
    it('should not create environment if prompt is cancelled', () => {
      const promptSpy = vi.fn().mockReturnValue(null);
      window.prompt = promptSpy;

      render(<Sidebar />);

      // Switch to Environments tab
      fireEvent.click(screen.getByText('Envs'));

      // Click New Environment (the ➕ button)
      const addBtns = screen.getAllByTitle('New Environment');
      fireEvent.click(addBtns[0]);

      expect(promptSpy).toHaveBeenCalled();
      expect(requestStore.environments.length).toBe(0);
    });
  });

  describe('RequestEditor', () => {
    it('should handle collection selection cancellation during save', () => {
      // Setup multiple collections
      runInAction(() => {
        requestStore.collections = [
            { id: '1', name: 'Col 1', requests: [] },
            { id: '2', name: 'Col 2', requests: [] }
        ];
      });

      const promptSpy = vi.fn();
      // First prompt is for name (return "My Req"), second is for collection index (return null)
      promptSpy.mockReturnValueOnce('My Req').mockReturnValueOnce(null);
      window.prompt = promptSpy;

      const alertSpy = vi.fn();
      window.alert = alertSpy;

      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Save'));

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(alertSpy).not.toHaveBeenCalledWith('Saved!');
      // Should not have saved
      expect(requestStore.collections[0].requests.length).toBe(0);
      expect(requestStore.collections[1].requests.length).toBe(0);
    });

    it('should handle invalid collection index during save', () => {
      // Setup multiple collections
      runInAction(() => {
        requestStore.collections = [
            { id: '1', name: 'Col 1', requests: [] },
            { id: '2', name: 'Col 2', requests: [] }
        ];
      });

      const promptSpy = vi.fn();
      // First prompt name, second invalid index "99"
      promptSpy.mockReturnValueOnce('My Req').mockReturnValueOnce('99');
      window.prompt = promptSpy;

      const alertSpy = vi.fn();
      window.alert = alertSpy;

      render(<RequestEditor />);

      fireEvent.click(screen.getByText('Save'));

      expect(promptSpy).toHaveBeenCalledTimes(2);
      expect(alertSpy).not.toHaveBeenCalledWith('Saved!');
      // Should not have saved
      expect(requestStore.collections[0].requests.length).toBe(0);
      expect(requestStore.collections[1].requests.length).toBe(0);
    });
  });

  describe('RequestStore Proxy Setters', () => {
    it('should update state via proxy setters', () => {
      runInAction(() => {
        requestStore.response = { status: 200 };
        requestStore.loading = true;
        requestStore.error = 'Some Error';
        requestStore.responseMetrics = { time: 100, size: '1KB' };
      });

      expect(requestStore.activeTab.response).toEqual({ status: 200 });
      expect(requestStore.activeTab.loading).toBe(true);
      expect(requestStore.activeTab.error).toBe('Some Error');
      expect(requestStore.activeTab.responseMetrics).toEqual({ time: 100, size: '1KB' });
    });
  });

  describe('RequestStore LoadTabs', () => {
    it('should handle invalid JSON in localStorage', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      // Return invalid JSON for requestTabs
      getItemSpy.mockImplementation((key) => {
        if (key === 'requestTabs') return '{invalid:json}';
        return null;
      });

      // Instantiate new store to trigger loadTabs
      new RequestStore();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to load tabs', expect.any(Error));

      consoleSpy.mockRestore();
      getItemSpy.mockRestore();
    });

    it('should handle missing active tab ID', () => {
        const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

        const tabs = JSON.stringify([{ id: 'tab1', name: 'Tab 1' }]);

        getItemSpy.mockImplementation((key) => {
          if (key === 'requestTabs') return tabs;
          if (key === 'activeTabId') return 'non-existent-id';
          return null;
        });

        const store = new RequestStore();

        // Should fallback to first tab
        expect(store.activeTabId).toBe('tab1');

        getItemSpy.mockRestore();
      });
  });
});
