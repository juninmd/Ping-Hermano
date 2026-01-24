import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CodeSnippetModal } from './CodeSnippetModal';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';
import '@testing-library/jest-dom';

// Mock clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('CodeSnippetModal', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = 'http://example.com';
            requestStore.headers = [];
            requestStore.auth = { type: 'none' };
            requestStore.body = '';
            requestStore.bodyType = 'text';
        });
        vi.restoreAllMocks();
    });

    it('should render cURL by default', () => {
        render(<CodeSnippetModal onClose={vi.fn()} />);
        expect(screen.getByDisplayValue(/curl -X GET/)).toBeInTheDocument();
    });

    it('should switch to Fetch', () => {
        render(<CodeSnippetModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Fetch'));
        expect(screen.getByDisplayValue(/fetch\("http:\/\/example.com"/)).toBeInTheDocument();
    });

    it('should copy code', () => {
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<CodeSnippetModal onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Copy'));
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(alertSpy).toHaveBeenCalledWith('Copied to clipboard!');
    });

    it('should handle Basic Auth', () => {
        runInAction(() => {
            requestStore.auth = { type: 'basic', username: 'u', password: 'p' };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        // cURL check. btoa('u:p') is 'dTpw'
        expect(screen.getByDisplayValue(/-H "Authorization: Basic dTpw"/)).toBeInTheDocument();
    });

    it('should handle Bearer Auth', () => {
        runInAction(() => {
            requestStore.auth = { type: 'bearer', token: 'tok' };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        expect(screen.getByDisplayValue(/-H "Authorization: Bearer tok"/)).toBeInTheDocument();
    });

    it('should handle API Key Auth (Header)', () => {
        runInAction(() => {
            requestStore.auth = { type: 'apikey', apiKey: { key: 'X-Key', value: '123', addTo: 'header' } };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        expect(screen.getByDisplayValue(/-H "X-Key: 123"/)).toBeInTheDocument();
    });

    it('should handle API Key Auth (Query)', () => {
        runInAction(() => {
            requestStore.auth = { type: 'apikey', apiKey: { key: 'api_key', value: '123', addTo: 'query' } };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        expect(screen.getByDisplayValue(/http:\/\/example.com\?api_key=123/)).toBeInTheDocument();
    });

    it('should close on button click', () => {
        const close = vi.fn();
        render(<CodeSnippetModal onClose={close} />);
        fireEvent.click(screen.getByText('✕'));
        expect(close).toHaveBeenCalled();
    });

    it('should close on overlay click', () => {
        const close = vi.fn();
        const { container } = render(<CodeSnippetModal onClose={close} />);
        // Overlay is the first child
        fireEvent.click(container.firstChild as Element);
        expect(close).toHaveBeenCalled();
    });

    it('should not close on content click', () => {
        const close = vi.fn();
        render(<CodeSnippetModal onClose={close} />);
        fireEvent.click(screen.getByText('Generate Code')); // Click header inside content
        expect(close).not.toHaveBeenCalled();
    });
});
