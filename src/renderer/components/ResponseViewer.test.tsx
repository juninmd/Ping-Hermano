import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResponseViewer } from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction } from 'mobx';

// Mock mobx-react-lite observer
// vi.mock('mobx-react-lite', async () => {
//     const actual = await vi.importActual('mobx-react-lite');
//     return {
//         ...actual,
//         observer: (component: any) => component,
//     };
// });

describe('ResponseViewer', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.response = null;
            requestStore.loading = false;
            requestStore.error = null;
            requestStore.responseMetrics = { time: 0, size: '0 B' };
        });
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
            requestStore.error = new Error('Network Error');
        });
        render(<ResponseViewer />);
        expect(screen.getByText('Error: Network Error')).toBeInTheDocument();
    });

    it('should show placeholder if no response', () => {
        render(<ResponseViewer />);
        expect(screen.getByText('Enter URL and click Send to get a response')).toBeInTheDocument();
    });

    it('should render response details (status, time, size)', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: 'test',
                headers: {},
                testResults: []
            };
            requestStore.responseMetrics = { time: 123, size: '1.2 KB' };
        });
        render(<ResponseViewer />);
        expect(screen.getByText(/Status:/)).toBeInTheDocument();
        expect(screen.getByText(/200 OK/)).toBeInTheDocument();
        expect(screen.getByText('Time: 123ms')).toBeInTheDocument();
        expect(screen.getByText('Size: 1.2 KB')).toBeInTheDocument();
    });

    it('should switch tabs', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: 'test',
                headers: { 'content-type': 'text/plain' },
                testResults: []
            };
        });
        render(<ResponseViewer />);

        // Body is default
        expect(screen.getByDisplayValue('test')).toBeInTheDocument();

        // Headers
        fireEvent.click(screen.getByText('Headers'));
        expect(screen.getByDisplayValue('content-type')).toBeInTheDocument();
        expect(screen.getByDisplayValue('text/plain')).toBeInTheDocument();

        // Preview
        fireEvent.click(screen.getByText('Preview'));
        expect(screen.getByTitle('Response Preview')).toBeInTheDocument();

        // Tests
        fireEvent.click(screen.getByText(/Test Results/));
        expect(screen.getByText('No tests executed')).toBeInTheDocument();
    });

    it('should render test results', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: 'test',
                headers: {},
                testResults: [
                    { name: 'Test 1', passed: true },
                    { name: 'Test 2', passed: false, message: 'Expected 200' }
                ]
            };
        });
        render(<ResponseViewer />);
        fireEvent.click(screen.getByText(/Test Results/));

        expect(screen.getByText('Test 1')).toBeInTheDocument();
        expect(screen.getByText('PASS')).toBeInTheDocument();

        expect(screen.getByText('Test 2')).toBeInTheDocument();
        expect(screen.getByText('FAIL')).toBeInTheDocument();
        expect(screen.getByText('- Expected 200')).toBeInTheDocument();
    });

    it('should render correct status colors', () => {
        const checkColor = (status: number, color: string) => {
            runInAction(() => {
                requestStore.response = { status, statusText: 'ST', data: '', headers: {} };
            });
            const { unmount } = render(<ResponseViewer />);
            const statusEl = screen.getByText(`${status} ST`);
            // styled-components passes class, we need to check computed style or use `toHaveStyle`?
            // jsdom doesn't fully support computed styles via stylesheets often, but toHaveStyle usually works for inline or styled-components if wired up.
            // Or we can check the color rule.

            // However, `toHaveStyle` checks inline styles or computed styles.
            // Let's assume toHaveStyle works.
            expect(statusEl).toHaveStyle(`color: ${color}`);
            unmount();
        };

        checkColor(200, '#6a9955');
        checkColor(301, '#cca700');
        checkColor(404, '#f48771');
        checkColor(500, '#f48771');

        // Coverage for default case
        runInAction(() => {
            requestStore.response = { status: 100, statusText: 'Continue', data: '', headers: {} };
        });
        const { unmount } = render(<ResponseViewer />);
        expect(screen.getByText('100 Continue')).toBeInTheDocument();
        unmount();
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
