import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
            expect(statusEl).toHaveStyle(`color: ${color}`);
            unmount();
        };

        checkColor(200, '#6a9955');
        checkColor(301, '#cca700');
        checkColor(404, '#f48771');
        checkColor(500, '#f48771');

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
        // It catches and returns content.toString(). Object toString is [object Object]
        expect(screen.getByDisplayValue('[object Object]')).toBeInTheDocument();

        spy.mockRestore();
    });

    it('should handle null data', () => {
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

    it('should handle undefined data', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: undefined,
                headers: {}
            };
        });
        render(<ResponseViewer />);
        expect(screen.getByDisplayValue('')).toBeInTheDocument();
    });

    it('should render preview iframe', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: '<html><body><h1>Hello</h1></body></html>',
                headers: {},
                testResults: []
            };
            requestStore.loading = false;
        });
        render(<ResponseViewer />);

        fireEvent.click(screen.getByText('Preview'));
        const iframe = screen.getByTitle('Response Preview');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('srcDoc', '<html><body><h1>Hello</h1></body></html>');
    });

    it('should render preview iframe with JSON data', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: { msg: "Hello" },
                headers: {},
                testResults: []
            };
            requestStore.loading = false;
        });
        render(<ResponseViewer />);

        fireEvent.click(screen.getByText('Preview'));
        const iframe = screen.getByTitle('Response Preview');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('srcDoc', '{"msg":"Hello"}');
    });

    it('should render preview iframe with null data', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: null,
                headers: {},
                testResults: []
            };
            requestStore.loading = false;
        });
        render(<ResponseViewer />);

        fireEvent.click(screen.getByText('Preview'));
        const iframe = screen.getByTitle('Response Preview');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('srcDoc', 'null');
    });

    it('should render empty tests message when no tests executed', () => {
        runInAction(() => {
            requestStore.response = {
                status: 200,
                statusText: 'OK',
                data: {},
                headers: {},
                testResults: []
            };
        });
        render(<ResponseViewer />);
        fireEvent.click(screen.getByText(/Test Results/));
        expect(screen.getByText('No tests executed')).toBeInTheDocument();
    });
});
