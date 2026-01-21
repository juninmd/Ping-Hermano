import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseViewer } from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction } from 'mobx';

// Mock mobx-react-lite observer
vi.mock('mobx-react-lite', async () => {
    const actual = await vi.importActual('mobx-react-lite');
    return {
        ...actual,
        observer: (component: any) => component,
    };
});

describe('ResponseViewer', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.response = null;
            requestStore.loading = false;
            requestStore.error = null;
            requestStore.responseMetrics = { time: 0, size: '0 B' };
        });
    });

    it('should format body as string if JSON parse fails', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: 'Invalid JSON {',
                headers: {}
            };
        });
        render(<ResponseViewer />);
        expect(screen.getByDisplayValue('Invalid JSON {')).toBeInTheDocument();
    });

    it('should format body as JSON string if data is object', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: { a: 1 },
                headers: {}
            };
        });
        render(<ResponseViewer />);
        expect(screen.getByDisplayValue(/{\s+"a": 1\s+}/)).toBeInTheDocument();
    });

    it('should format body as JSON string if data is valid JSON string', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: '{"a":1}',
                headers: {}
            };
        });
        render(<ResponseViewer />);
        expect(screen.getByDisplayValue(/{\s+"a": 1\s+}/)).toBeInTheDocument();
    });

    it('should handle circular object in formatBody (defensive)', () => {
        const circular: any = { a: 1 };
        circular.self = circular;

        // This causes MobX RangeError because when we set response to observable object with circular ref?
        // No, `requestStore.response` is observable. If we assign circular object, MobX tries to make it observable deep.
        // We should pass it as a non-observable or make sure it's handled.
        // Or we can mock the formatBody function input directly if we could extract it.
        // But here we are assigning to store.

        // If we assign a string that is circular JSON? JSON.stringify throws.
        // If we assign object, MobX tries to proxy it.

        // Let's assume response.data comes from API and might be circular (unlikely from JSON API but possible in JS object).
        // If it is circular, `JSON.stringify` inside `formatBody` will throw.
        // We need to test that `catch` block in `formatBody`.

        // We can simulate `JSON.stringify` throwing by spying on it?
        const spy = vi.spyOn(JSON, 'stringify').mockImplementation(() => { throw new Error('Circular'); });

        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: { a: 1 },
                headers: {}
            };
        });
        render(<ResponseViewer />);

        // formatBody catches and returns string conversion?
        // catch { return content.toString(); }

        expect(screen.getByDisplayValue('[object Object]')).toBeInTheDocument();

        spy.mockRestore();
    });

    it('should handle null/undefined data', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: null,
                headers: {}
            };
        });
        render(<ResponseViewer />);
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });
});
