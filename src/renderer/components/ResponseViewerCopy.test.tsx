import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseViewer } from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction } from 'mobx';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock clipboard and URL
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
});

global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('ResponseViewer Copy/Download', () => {
  beforeEach(() => {
    runInAction(() => {
      requestStore.response = {
        data: { test: 'value' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        testResults: [],
      };
      requestStore.loading = false;
      requestStore.error = null;
      // Reset metrics to avoid undefined errors if component accesses them
      requestStore.responseMetrics = { time: 100, size: '1KB' };
    });
    vi.clearAllMocks();
  });

  it('copies response body to clipboard', async () => {
    render(<ResponseViewer />);

    const copyBtn = screen.getByText('Copy');
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify({ test: 'value' }, null, 2)
    );
  });

  it('downloads response body', async () => {
    render(<ResponseViewer />);

    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    const downloadBtn = screen.getByText('Download');
    fireEvent.click(downloadBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(linkClickSpy).toHaveBeenCalled();

    linkClickSpy.mockRestore();
  });
});
