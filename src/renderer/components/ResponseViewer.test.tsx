import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponseViewer } from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('ResponseViewer', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.response = null;
            requestStore.loading = false;
            requestStore.error = null;
            requestStore.responseMetrics = { time: 0, size: '0 B' };
        });
        vi.restoreAllMocks();
    });

    it('should show loading state', () => {
        runInAction(() => {
            requestStore.loading = true;
        });
        render(<ResponseViewer />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error state', () => {
        runInAction(() => {
            requestStore.error = { message: 'Network Error' };
        });
        render(<ResponseViewer />);
        expect(screen.getByText('Error: Network Error')).toBeInTheDocument();
    });

    it('should show placeholder when no response', () => {
        render(<ResponseViewer />);
        expect(screen.getByText('Enter URL and click Send to get a response')).toBeInTheDocument();
    });

    it('should render response details', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: { success: true },
                headers: { 'content-type': 'application/json' },
                testResults: []
            };
            requestStore.responseMetrics = { time: 100, size: '15 B' };
        });
        render(<ResponseViewer />);
        expect(screen.getByText(/Status:/)).toBeInTheDocument();
        expect(screen.getByText(/200 OK/)).toBeInTheDocument();
        expect(screen.getByText('Time: 100ms')).toBeInTheDocument();
        expect(screen.getByText('Size: 15 B')).toBeInTheDocument();
    });

    it('should switch tabs', () => {
         runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: '<html></html>',
                headers: { 'h1': 'v1' },
                testResults: [{ name: 'T1', passed: true }]
            };
        });
        render(<ResponseViewer />);

        fireEvent.click(screen.getByText('Preview'));
        expect(screen.getByTitle('Response Preview')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Headers'));
        expect(screen.getByDisplayValue('h1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('v1')).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Test Results/));
        expect(screen.getByText('T1')).toBeInTheDocument();
        expect(screen.getByText('PASS')).toBeInTheDocument();
    });

    it('should display failed tests', () => {
         runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: {},
                headers: {},
                testResults: [{ name: 'T1', passed: false, message: 'Expected 1 to be 2' }]
            };
        });
        render(<ResponseViewer />);
        fireEvent.click(screen.getByText(/Test Results/));

        expect(screen.getByText('T1')).toBeInTheDocument();
        expect(screen.getByText('FAIL')).toBeInTheDocument();
        expect(screen.getByText(/Expected 1 to be 2/)).toBeInTheDocument();
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

    it('should handle circular object in formatBody', () => {
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

    it('should color status code correctly', async () => {
        const { unmount } = render(<ResponseViewer />);

        const statuses = [200, 300, 400, 500];
        for (const s of statuses) {
             runInAction(() => {
                requestStore.response = { status: s, statusText: 'Stat', data: '', headers: {} };
             });
             expect(await screen.findByText(`${s} Stat`)).toBeInTheDocument();
        }
        unmount();
    });
});
