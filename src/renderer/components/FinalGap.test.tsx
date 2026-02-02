import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RequestEditor from './RequestEditor';
import Sidebar from './Sidebar';
import { requestStore } from '../stores/RequestStore';

// Mock window interactions
const originalPrompt = window.prompt;
const originalConfirm = window.confirm;
const originalAlert = window.alert;

describe('Final Gap Coverage - Components', () => {
  beforeEach(() => {
    window.prompt = vi.fn();
    window.confirm = vi.fn();
    window.alert = vi.fn();

    // Reset store
    act(() => {
      requestStore.collections = [];
      requestStore.environments = [];
    });
  });

  afterEach(() => {
    window.prompt = originalPrompt;
    window.confirm = originalConfirm;
    window.alert = originalAlert;
  });

  it('RequestEditor: should save to specific collection index when prompted', () => {
    // Setup 2 collections
    act(() => {
      requestStore.createCollection('Col 1'); // Index 0
      requestStore.createCollection('Col 2'); // Index 1
    });

    render(<RequestEditor />);

    // Mock prompt: First for Name, Second for Collection Index
    vi.mocked(window.prompt)
      .mockReturnValueOnce('My Request') // Name
      .mockReturnValueOnce('1');         // Index

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // Verify request added to second collection
    expect(requestStore.collections[1].requests).toHaveLength(1);
    expect(requestStore.collections[1].requests[0].name).toBe('My Request');
    expect(window.alert).toHaveBeenCalledWith('Saved!');
  });

  it('RequestEditor: should handle invalid index input', () => {
      act(() => {
        requestStore.createCollection('Col 1');
        requestStore.createCollection('Col 2');
      });

      render(<RequestEditor />);

      vi.mocked(window.prompt)
        .mockReturnValueOnce('My Request')
        .mockReturnValueOnce('99'); // Invalid

      const saveBtn = screen.getByText('Save');
      fireEvent.click(saveBtn);

      expect(requestStore.collections[0].requests).toHaveLength(0);
      expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('RequestEditor: should handle null index input', () => {
        act(() => {
          requestStore.createCollection('Col 1');
          requestStore.createCollection('Col 2');
        });

        render(<RequestEditor />);

        vi.mocked(window.prompt)
          .mockReturnValueOnce('My Request')
          .mockReturnValueOnce(null); // Cancel

        const saveBtn = screen.getByText('Save');
        fireEvent.click(saveBtn);

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
      });

  it('Sidebar: should delete environment when confirmed', () => {
    act(() => {
      requestStore.createEnvironment('Env 1');
    });
    const envId = requestStore.environments[0].id;

    render(<Sidebar />);

    // Switch to Envs tab
    fireEvent.click(screen.getByText('Envs'));

    // Mock confirm true
    vi.mocked(window.confirm).mockReturnValue(true);

    // Click delete (need to find the button, usually title="Delete")
    const deleteBtns = screen.getAllByTitle('Delete');
    fireEvent.click(deleteBtns[0]);

    expect(requestStore.environments).toHaveLength(0);
  });

  it('Sidebar: should rename request inside collection', () => {
    act(() => {
      requestStore.createCollection('Col 1');
      requestStore.collections[0].requests.push({
          id: 'req1',
          method: 'GET',
          url: 'http://test',
          name: 'Old Name',
          date: new Date().toISOString()
      });
    });

    render(<Sidebar />);

    // Switch to Collections tab
    fireEvent.click(screen.getByText('Collections'));

    // Mock prompt
    vi.mocked(window.prompt).mockReturnValue('New Name');

    // Click rename request (title="Rename Request")
    const renameBtn = screen.getByTitle('Rename Request');
    fireEvent.click(renameBtn);

    expect(requestStore.collections[0].requests[0].name).toBe('New Name');
  });

    it('Sidebar: should NOT rename request if prompt cancelled', () => {
    act(() => {
      requestStore.createCollection('Col 1');
      requestStore.collections[0].requests.push({
          id: 'req1',
          method: 'GET',
          url: 'http://test',
          name: 'Old Name',
          date: new Date().toISOString()
      });
    });

    render(<Sidebar />);

    // Switch to Collections tab
    fireEvent.click(screen.getByText('Collections'));

    // Mock prompt null
    vi.mocked(window.prompt).mockReturnValue(null);

    // Click rename request
    const renameBtn = screen.getByTitle('Rename Request');
    fireEvent.click(renameBtn);

    expect(requestStore.collections[0].requests[0].name).toBe('Old Name');
  });
});
