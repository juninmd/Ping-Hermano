import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

// Allow MobX action overriding
configure({ enforceActions: "never" });

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
            requestStore.bodyType = 'text';
            requestStore.bodyFormData = [{ key: '', value: '', type: 'text' }];
            requestStore.bodyUrlEncoded = [{ key: '', value: '' }];
        });
        vi.restoreAllMocks();

        // Setup default mock for electronAPI
        if (!window.electronAPI) {
            window.electronAPI = {
                makeRequest: vi.fn(),
            } as any;
        }
        (window.electronAPI.makeRequest as any).mockReset();
        (window.electronAPI.makeRequest as any).mockResolvedValue({
            data: 'test',
            status: 200,
            statusText: 'OK',
            headers: {}
        });

        // Mock window.alert and prompt
        global.alert = vi.fn();
        global.prompt = vi.fn();
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

    it('should call sendRequest (and thus electronAPI) when Send is clicked', async () => {
        runInAction(() => {
            requestStore.url = 'http://test.com';
        });

        render(<RequestEditor />);
        const button = screen.getByText('Send');

        await act(async () => {
            fireEvent.click(button);
        });

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
        expect(screen.getByPlaceholderText('Request Body (Text)')).toBeInTheDocument();
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
        expect(requestStore.headers).toHaveLength(2);
    });

    it('should edit params (add new row)', () => {
        render(<RequestEditor />);
        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'q' } });
        expect(requestStore.queryParams[0].key).toBe('q');
        expect(requestStore.queryParams).toHaveLength(2);
    });

    it('should edit body (text/json)', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));
        const textarea = screen.getByPlaceholderText('Request Body (Text)');
        fireEvent.change(textarea, { target: { value: '{"test":true}' } });
        expect(requestStore.body).toBe('{"test":true}');
    });

    it('should toggle body type', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));

        const jsonRadio = screen.getByLabelText('JSON');
        fireEvent.click(jsonRadio);
        expect(requestStore.bodyType).toBe('json');

        rerender(<RequestEditor />);
        expect(screen.getByPlaceholderText('Request Body (JSON)')).toBeInTheDocument();
    });

    it('should edit auth (Basic and Bearer)', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));

        const typeSelect = screen.getByDisplayValue('No Auth');

        // Basic Auth
        fireEvent.change(typeSelect, { target: { value: 'basic' } });
        rerender(<RequestEditor />);

        const usernameInput = screen.getByPlaceholderText('Username');
        fireEvent.change(usernameInput, { target: { value: 'user' } });
        expect(requestStore.auth.username).toBe('user');

        // Bearer Token
        fireEvent.change(screen.getByDisplayValue('Basic Auth'), { target: { value: 'bearer' } });
        rerender(<RequestEditor />);

        const tokenInput = screen.getByPlaceholderText('Bearer Token');
        fireEvent.change(tokenInput, { target: { value: 'token123' } });
        expect(requestStore.auth.token).toBe('token123');
    });

    it('should edit auth (API Key)', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));

        const typeSelect = screen.getByDisplayValue('No Auth');
        fireEvent.change(typeSelect, { target: { value: 'apikey' } });
        rerender(<RequestEditor />);

        const keyInput = screen.getByPlaceholderText('Key');
        fireEvent.change(keyInput, { target: { value: 'X-API-KEY' } });
        expect(requestStore.auth.apiKey?.key).toBe('X-API-KEY');
    });

    it('should remove header row', () => {
        runInAction(() => {
            requestStore.headers = [
                { key: 'h1', value: 'v1' },
                { key: '', value: '' }
            ];
        });
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);
        expect(requestStore.headers).toHaveLength(1);
    });

    it('should handle save request', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
        });
        (global.prompt as any).mockReturnValueOnce('My Request').mockReturnValueOnce('0');

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(1);
        expect(requestStore.collections[0].requests[0].name).toBe('My Request');
    });

    it('should handle save request cancellation (name prompt)', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
        });
        (global.prompt as any).mockReturnValue(null);

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
    });

    it('should alert if no collections when saving', () => {
        runInAction(() => {
            requestStore.collections = [];
        });
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(global.alert).toHaveBeenCalledWith('Create a collection first!');
    });

    it('should handle invalid collection selection', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }, { id: '2', name: 'Col2', requests: [] }];
        });
        (global.prompt as any).mockReturnValueOnce('Req').mockReturnValueOnce('99');
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
    });

    it('should handle collection selection cancellation', () => {
         runInAction(() => {
            requestStore.collections = [
                { id: '1', name: 'Col1', requests: [] },
                { id: '2', name: 'Col2', requests: [] }
            ];
        });
        (global.prompt as any).mockReturnValueOnce('Req').mockReturnValueOnce(null);
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should save to selected collection index', () => {
        runInAction(() => {
            requestStore.collections = [
                { id: '1', name: 'Col1', requests: [] },
                { id: '2', name: 'Col2', requests: [] }
            ];
        });
        (global.prompt as any).mockReturnValueOnce('My Req').mockReturnValueOnce('1');
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(1);
    });

    it('should handle Enter key in URL input', async () => {
        runInAction(() => {
            requestStore.url = 'http://test.com';
        });
        render(<RequestEditor />);
        const input = screen.getByPlaceholderText('Enter request URL');
        await act(async () => {
             fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        });
        expect(window.electronAPI.makeRequest).toHaveBeenCalled();
    });

    it('should edit form-data body', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));
        fireEvent.click(screen.getByLabelText('Form Data'));
        rerender(<RequestEditor />);

        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'file' } });
        expect(requestStore.bodyFormData[0].key).toBe('file');

        // Remove row
        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);
        expect(requestStore.bodyFormData).toHaveLength(1);
    });

    it('should edit x-www-form-urlencoded body', () => {
        const { rerender } = render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body'));
        fireEvent.click(screen.getByLabelText('x-www-form-urlencoded'));
        rerender(<RequestEditor />);

        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'foo' } });
        expect(requestStore.bodyUrlEncoded[0].key).toBe('foo');

        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);
        expect(requestStore.bodyUrlEncoded).toHaveLength(1);
    });

    it('should open code generation modal', () => {
        render(<RequestEditor />);
        const codeButton = screen.getByTitle('Generate Code');
        fireEvent.click(codeButton);
        expect(screen.getAllByText('Generate Code')[0]).toBeInTheDocument();
    });
});
