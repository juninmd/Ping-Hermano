import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CodeSnippetModal } from './CodeSnippetModal';
import { requestStore } from '../stores/RequestStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';

// Mock mobx-react-lite to just render the component
vi.mock('mobx-react-lite', async () => {
    const actual = await vi.importActual('mobx-react-lite');
    return {
        ...actual as any,
        observer: (component: any) => component,
    };
});

// Mock clipboard
const writeTextMock = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: writeTextMock,
  },
});

describe('CodeSnippetModal Auth Coverage', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.setMethod('GET');
            requestStore.setUrl('http://example.com');
            requestStore.setHeaders([]);
            requestStore.setAuth({ type: 'none' });
        });
        writeTextMock.mockReset();
        // Mock alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should generate code with Bearer Token', async () => {
        runInAction(() => {
            requestStore.setAuth({ type: 'bearer', token: 'secret-token' });
        });

        render(<CodeSnippetModal onClose={() => {}} />);

        // Wait for useEffect
        await waitFor(() => {
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            expect(textarea.value).toContain('Authorization: Bearer secret-token');
        });
    });

    it('should generate code with API Key in Header', async () => {
        runInAction(() => {
            requestStore.setAuth({
                type: 'apikey',
                apiKey: { key: 'X-API-KEY', value: '12345', addTo: 'header' }
            });
        });

        render(<CodeSnippetModal onClose={() => {}} />);

        await waitFor(() => {
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            expect(textarea.value).toContain("X-API-KEY: 12345");
        });
    });

    it('should generate code with API Key in Query', async () => {
        runInAction(() => {
            requestStore.setUrl('http://example.com');
            requestStore.setAuth({
                type: 'apikey',
                apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
            });
        });

        render(<CodeSnippetModal onClose={() => {}} />);

        await waitFor(() => {
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            expect(textarea.value).toContain('http://example.com?api_key=12345');
        });
    });

    it('should append API Key to existing Query', async () => {
        runInAction(() => {
            requestStore.setUrl('http://example.com?foo=bar');
            requestStore.setAuth({
                type: 'apikey',
                apiKey: { key: 'api_key', value: '12345', addTo: 'query' }
            });
        });

        render(<CodeSnippetModal onClose={() => {}} />);

        await waitFor(() => {
            const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
            // The logic inside uses encodeURIComponent
            expect(textarea.value).toContain('http://example.com?foo=bar&api_key=12345');
        });
    });
});
