import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeSnippetModal } from './CodeSnippetModal';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('CodeSnippetModal Coverage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.addTab();
            requestStore.url = 'https://api.example.com';
            requestStore.method = 'GET';
            requestStore.headers = [];
            requestStore.auth = { type: 'none' };
        });
    });

    it('should generate code with Bearer Token', () => {
        runInAction(() => {
            requestStore.auth = { type: 'bearer', token: 'my-token' };
        });
        render(<CodeSnippetModal onClose={() => {}} />);

        const codeArea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(codeArea.value).toContain('Authorization: Bearer my-token');
    });

    it('should generate code with API Key in Header', () => {
        runInAction(() => {
            requestStore.auth = { type: 'apikey', apiKey: { key: 'X-API-KEY', value: '12345', addTo: 'header' } };
        });
        render(<CodeSnippetModal onClose={() => {}} />);

        const codeArea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(codeArea.value).toContain('X-API-KEY: 12345');
    });

    it('should generate code with API Key in Query', () => {
        runInAction(() => {
            requestStore.auth = { type: 'apikey', apiKey: { key: 'api_key', value: 'secret', addTo: 'query' } };
        });
        render(<CodeSnippetModal onClose={() => {}} />);

        const codeArea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(codeArea.value).toContain('https://api.example.com?api_key=secret');
    });

    it('should generate code with API Key in Query appending to existing params', () => {
        runInAction(() => {
            requestStore.url = 'https://api.example.com?existing=true';
            requestStore.auth = { type: 'apikey', apiKey: { key: 'api_key', value: 'secret', addTo: 'query' } };
        });
        render(<CodeSnippetModal onClose={() => {}} />);

        const codeArea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(codeArea.value).toContain('https://api.example.com?existing=true&api_key=secret');
    });
});
