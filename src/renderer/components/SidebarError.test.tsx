import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Sidebar from '../components/Sidebar';
import { requestStore } from '../stores/RequestStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Sidebar Error Handling', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'prompt').mockImplementation(() => 'test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should alert if import collections fails', async () => {
    render(<Sidebar />);

    // Switch to collections tab
    fireEvent.click(screen.getByText('Collections'));

    // We rely on the real implementation to fail on invalid JSON
    const file = new File(['invalid-json'], 'test.json', { type: 'application/json' });
    const input = screen.getByTitle('Import Collections').previousElementSibling as HTMLInputElement;

    // We need to trigger the change event
    // Note: in previous tests (Sidebar.test.tsx), FileReader might have been mocked or used jsdom's.
    // Jsdom supports FileReader.

    // However, we want to ensure requestStore.importCollections is called and returns false.
    // And then alert is called.

    // Using fireEvent.change on file input
    // We need to use Object.defineProperty for files as it is read-only
    // But testing-library's userEvent.upload is better.
    // Or just fireEvent.change({ target: { files: [file] } }) works in most cases if we are careful.

    Object.defineProperty(input, 'files', {
        value: [file]
    });

    fireEvent.change(input);

    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to import collections. Invalid format?');
    });
  });

  it('should alert if import environments fails', async () => {
      render(<Sidebar />);

      // Switch to environments tab
      fireEvent.click(screen.getByText('Envs'));

      const file = new File(['invalid-json'], 'test.json', { type: 'application/json' });
      // Find input. It's hidden. Title "Import Environments" is on the button that triggers click.
      // But the input is previous sibling of the button?
      // Sidebar.tsx:
      // <input ... ref={envFileInput} ... />
      // <ActionBtn ... title="Import Environments">

      const btn = screen.getByTitle('Import Environments');
      const input = btn.previousElementSibling as HTMLInputElement;

      Object.defineProperty(input, 'files', {
          value: [file]
      });

      fireEvent.change(input);

      await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith('Failed to import environments. Invalid format?');
      });
  });
});
