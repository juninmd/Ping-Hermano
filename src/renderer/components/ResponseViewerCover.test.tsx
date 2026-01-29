import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResponseViewer from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';

// Mock mobx-react-lite
vi.mock('mobx-react-lite', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        observer: (component: any) => component,
    };
});

describe('ResponseViewer Coverage', () => {
    beforeEach(() => {
        requestStore.response = null;
        requestStore.loading = false;
        requestStore.error = null;
    });

    it('should display non-JSON string body as is', () => {
        requestStore.response = {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: 'Plain text response',
            testResults: []
        };
        requestStore.responseMetrics = { time: 100, size: '20 B' };

        render(<ResponseViewer />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('Plain text response');
    });

    it('should handle null/undefined content in formatBody', () => {
        // Technically data shouldn't be null if response exists, but for coverage of formatBody
        requestStore.response = {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: null,
            testResults: []
        };
        requestStore.responseMetrics = { time: 100, size: '0 B' };

        render(<ResponseViewer />);
        const textarea = screen.getByRole('textbox');
        expect(textarea).toHaveValue('');
    });
});
