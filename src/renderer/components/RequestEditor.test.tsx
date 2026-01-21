import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

// Allow MobX action overriding if needed for mocking in tests
configure({ enforceActions: "never" });

// Mock mobx-react-lite observer
vi.mock('mobx-react-lite', async () => {
    const actual = await vi.importActual('mobx-react-lite');
    return {
        ...actual,
        observer: (component: any) => component,
    };
});

describe('RequestEditor', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = '';
            requestStore.headers = [{ key: '', value: '' }];
            requestStore.queryParams = [{ key: '', value: '' }];
            requestStore.body = '';
            requestStore.auth = { type: 'none' };
            requestStore.preRequestScript = '';
            requestStore.testScript = '';
            requestStore.loading = false;
            requestStore.collections = [];
        });
        vi.restoreAllMocks();

        // Setup default mock for electronAPI
        if (!window.electronAPI) {
            window.electronAPI = {
                makeRequest: vi.fn(),
            } as any;
        }
        (window.electronAPI.makeRequest as any).mockReset();
        (window.electronAPI.makeRequest as any).mockResolvedValue({});
    });

    it('should render input fields', () => {
        render(<RequestEditor />);
        expect(screen.getByPlaceholderText('Enter request URL')).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });

    it('should update method in store', () => {
        render(<RequestEditor />);
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'POST' } });
        expect(requestStore.method).toBe('POST');
    });

    it('should update url in store', () => {
        render(<RequestEditor />);
        const input = screen.getByPlaceholderText('Enter request URL');
        fireEvent.change(input, { target: { value: 'http://example.com' } });
        expect(requestStore.url).toBe('http://example.com');
    });

    it('should call sendRequest (and thus electronAPI) when Send is clicked', () => {
        runInAction(() => {
            requestStore.url = 'http://test.com';
        });

        render(<RequestEditor />);
        const button = screen.getByText('Send');
        fireEvent.click(button);

        expect(window.electronAPI.makeRequest).toHaveBeenCalled();
    });

    it('should show loading state', () => {
        runInAction(() => {
            requestStore.loading = true;
        });
        render(<RequestEditor />);
        expect(screen.getByText('Sending...')).toBeInTheDocument();
    });

    it('should switch tabs', () => {
        render(<RequestEditor />);
        expect(screen.getAllByPlaceholderText('Key')[0]).toBeInTheDocument();
        fireEvent.click(screen.getByText('Auth'));
        expect(screen.getByText('Type:')).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Headers/));
        expect(screen.getAllByPlaceholderText('Key')[0]).toBeInTheDocument();
        fireEvent.click(screen.getByText('Body'));
        expect(screen.getByPlaceholderText('Request Body (JSON, XML, Text...)')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Pre-req'));
        expect(screen.getByPlaceholderText('// Write your pre-request script here')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Tests'));
        expect(screen.getByPlaceholderText(/\/\/ Write your tests here/)).toBeInTheDocument();
    });

    it('should edit headers (add new row)', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'Content-Type' } });
        expect(requestStore.headers[0].key).toBe('Content-Type');
        const valueInputs = screen.getAllByPlaceholderText('Value');
        fireEvent.change(valueInputs[0], { target: { value: 'application/json' } });
        expect(requestStore.headers[0].value).toBe('application/json');
        expect(requestStore.headers).toHaveLength(2);
    });

    it('should edit headers (existing row)', () => {
        runInAction(() => {
            requestStore.headers = [
                { key: 'h1', value: 'v1' },
                { key: '', value: '' }
            ];
        });
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));

        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'h1-mod' } });

        expect(requestStore.headers[0].key).toBe('h1-mod');
        expect(requestStore.headers).toHaveLength(2);
    });

    it('should edit params (add new row)', () => {
        render(<RequestEditor />);
        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'q' } });
        expect(requestStore.queryParams[0].key).toBe('q');
        const valueInputs = screen.getAllByPlaceholderText('Value');
        fireEvent.change(valueInputs[0], { target: { value: 'search' } });
        expect(requestStore.queryParams[0].value).toBe('search');
        expect(requestStore.queryParams).toHaveLength(2);
    });

    it('should edit params (existing row)', () => {
        runInAction(() => {
            requestStore.queryParams = [
                { key: 'p1', value: 'v1' },
                { key: '', value: '' }
            ];
        });
        render(<RequestEditor />);

        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'p1-mod' } });

        expect(requestStore.queryParams[0].key).toBe('p1-mod');
        expect(requestStore.queryParams).toHaveLength(2);
    });

    it('should edit body', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));
        const textarea = screen.getByPlaceholderText('Request Body (JSON, XML, Text...)');
        fireEvent.change(textarea, { target: { value: '{"test":true}' } });
        expect(requestStore.body).toBe('{"test":true}');
    });

    it('should edit auth', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));
        const selects = screen.getAllByRole('combobox');
        const authSelect = selects[1];
        fireEvent.change(authSelect, { target: { value: 'basic' } });
        expect(requestStore.auth.type).toBe('basic');
        rerender(<RequestEditor />);
        const usernameInput = screen.getByPlaceholderText('Username');
        fireEvent.change(usernameInput, { target: { value: 'user' } });
        expect(requestStore.auth.username).toBe('user');
        const passwordInput = screen.getByPlaceholderText('Password');
        fireEvent.change(passwordInput, { target: { value: 'pass' } });
        expect(requestStore.auth.password).toBe('pass');
        const selects2 = screen.getAllByRole('combobox');
        fireEvent.change(selects2[1], { target: { value: 'bearer' } });
        expect(requestStore.auth.type).toBe('bearer');
        rerender(<RequestEditor />);
        const tokenInput = screen.getByPlaceholderText('Bearer Token');
        fireEvent.change(tokenInput, { target: { value: 'token123' } });
        expect(requestStore.auth.token).toBe('token123');
    });

    it('should edit pre-request script', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Pre-req'));
        const textarea = screen.getByPlaceholderText('// Write your pre-request script here');
        fireEvent.change(textarea, { target: { value: 'console.log("pre")' } });
        expect(requestStore.preRequestScript).toBe('console.log("pre")');
    });

    it('should edit test script', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Tests'));
        const textarea = screen.getByPlaceholderText(/\/\/ Write your tests here/);
        fireEvent.change(textarea, { target: { value: 'console.log("test")' } });
        expect(requestStore.testScript).toBe('console.log("test")');
    });

    it('should remove header row', () => {
        runInAction(() => {
            requestStore.headers = [
                { key: 'h1', value: 'v1' },
                { key: '', value: '' }
            ];
        });
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);
        expect(requestStore.headers).toHaveLength(1);
        expect(requestStore.headers[0].key).toBe('');
    });

    it('should remove param row', () => {
        runInAction(() => {
            requestStore.queryParams = [
                { key: 'p1', value: 'v1' },
                { key: '', value: '' }
            ];
        });
        const { rerender } = render(<RequestEditor />);
        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);
        expect(requestStore.queryParams).toHaveLength(1);
        expect(requestStore.queryParams[0].key).toBe('');
    });

    it('should handle save request', () => {
        // We can't mock saveRequestToCollection if it's non-configurable.
        // Instead we can verify side effects (collection updated)
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
        });
        global.prompt = vi.fn().mockReturnValueOnce('My Request').mockReturnValueOnce('0');
        global.alert = vi.fn();

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(1);
        expect(requestStore.collections[0].requests[0].name).toBe('My Request');
    });

    it('should handle save request cancellation', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
        });
        global.prompt = vi.fn().mockReturnValue(null);
        global.alert = vi.fn();
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
    });

    it('should alert if no collections when saving', () => {
        runInAction(() => {
            requestStore.collections = [];
        });
        global.alert = vi.fn();
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(global.alert).toHaveBeenCalledWith('Create a collection first!');
    });

    it('should handle invalid collection selection', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }, { id: '2', name: 'Col2', requests: [] }];
        });
        global.prompt = vi.fn().mockReturnValueOnce('Req').mockReturnValueOnce('99');
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should handle Enter key in URL input', () => {
        runInAction(() => {
            requestStore.url = 'http://test.com';
        });
        render(<RequestEditor />);
        const input = screen.getByPlaceholderText('Enter request URL');
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(window.electronAPI.makeRequest).toHaveBeenCalled();
    });

    it('should remove header row (coverage for else branch)', () => {
        runInAction(() => {
            requestStore.headers = [{ key: 'h1', value: 'v1' }, { key: '', value: '' }];
        });
        const { getByText } = render(<RequestEditor />);
        fireEvent.click(getByText(/Headers/));
        const deleteButtons = screen.getAllByText('✕');
        expect(deleteButtons).toHaveLength(1);
    });
});
