import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

// Removed mobx-react-lite mock to enable real reactivity

describe('RequestEditor', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = '';
            requestStore.headers = [{ key: '', value: '' }];
            requestStore.queryParams = [{ key: '', value: '' }];
            requestStore.body = '';
            requestStore.bodyFormData = [{ key: '', value: '', type: 'text' }];
            requestStore.bodyUrlEncoded = [{ key: '', value: '' }];
            requestStore.bodyType = 'text';
            requestStore.auth = { type: 'none' };
            requestStore.preRequestScript = '';
            requestStore.testScript = '';
            requestStore.loading = false;
            requestStore.collections = [];
        });
        vi.restoreAllMocks();

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

    it('should call sendRequest when Send is clicked', () => {
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
        fireEvent.click(screen.getByText('Auth'));
        expect(screen.getByText('Type:')).toBeInTheDocument();
        fireEvent.click(screen.getByText(/Headers/));
        expect(screen.getAllByPlaceholderText('Key')[0]).toBeInTheDocument();
    });

    it('should edit headers (add new row)', async () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'Content-Type' } });

        await waitFor(() => {
            expect(requestStore.headers).toHaveLength(2);
        });

        expect(requestStore.headers[0].key).toBe('Content-Type');
    });

    it('should remove header row', async () => {
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

        await waitFor(() => {
             expect(requestStore.headers).toHaveLength(1);
        });
        expect(requestStore.headers[0].key).toBe('');
    });

    describe('Auth', () => {
        it('should edit Basic Auth', async () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Auth'));
            const typeSelect = screen.getAllByRole('combobox')[1];
            fireEvent.change(typeSelect, { target: { value: 'basic' } });

            await waitFor(() => expect(screen.getByPlaceholderText('Username')).toBeInTheDocument());

            fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'user' } });
            fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'pass' } });

            expect(requestStore.auth.username).toBe('user');
            expect(requestStore.auth.password).toBe('pass');
        });

        it('should edit API Key Auth', async () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Auth'));
            const typeSelect = screen.getAllByRole('combobox')[1];
            fireEvent.change(typeSelect, { target: { value: 'apikey' } });

            await waitFor(() => expect(screen.getByPlaceholderText('Key')).toBeInTheDocument());

            fireEvent.change(screen.getByPlaceholderText('Key'), { target: { value: 'x-api-key' } });
            fireEvent.change(screen.getByPlaceholderText('Value'), { target: { value: '12345' } });

            const addToSelect = screen.getAllByRole('combobox')[2];
            fireEvent.change(addToSelect, { target: { value: 'query' } });

            expect(requestStore.auth.apiKey?.key).toBe('x-api-key');
            expect(requestStore.auth.apiKey?.value).toBe('12345');
            expect(requestStore.auth.apiKey?.addTo).toBe('query');
        });
    });

    describe('Body', () => {
        it('should edit Form Data', async () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));
            fireEvent.click(screen.getByLabelText('Form Data'));

            await waitFor(() => expect(requestStore.bodyType).toBe('form-data'));

            const keyInputs = screen.getAllByPlaceholderText('Key');
            fireEvent.change(keyInputs[0], { target: { value: 'file' } });

            await waitFor(() => expect(requestStore.bodyFormData).toHaveLength(2));

            const valueInputs = screen.getAllByPlaceholderText('Value');
            fireEvent.change(valueInputs[0], { target: { value: 'content' } });

            expect(requestStore.bodyFormData[0].key).toBe('file');
            expect(requestStore.bodyFormData[0].value).toBe('content');
        });

        it('should remove Form Data row', async () => {
             runInAction(() => {
                requestStore.bodyType = 'form-data';
                requestStore.bodyFormData = [
                    { key: 'f1', value: 'v1', type: 'text' },
                    { key: '', value: '', type: 'text' }
                ];
            });
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));

            const deleteButtons = screen.getAllByText('✕');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => expect(requestStore.bodyFormData).toHaveLength(1));
        });

         it('should edit Url Encoded', async () => {
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));
            fireEvent.click(screen.getByLabelText('x-www-form-urlencoded'));

            await waitFor(() => expect(requestStore.bodyType).toBe('x-www-form-urlencoded'));

            const keyInputs = screen.getAllByPlaceholderText('Key');
            fireEvent.change(keyInputs[0], { target: { value: 'foo' } });

            await waitFor(() => expect(requestStore.bodyUrlEncoded).toHaveLength(2));

            expect(requestStore.bodyUrlEncoded[0].key).toBe('foo');
        });

         it('should remove Url Encoded row', async () => {
             runInAction(() => {
                requestStore.bodyType = 'x-www-form-urlencoded';
                requestStore.bodyUrlEncoded = [
                    { key: 'u1', value: 'v1' },
                    { key: '', value: '' }
                ];
            });
            render(<RequestEditor />);
            fireEvent.click(screen.getByText('Body'));

            const deleteButtons = screen.getAllByText('✕');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => expect(requestStore.bodyUrlEncoded).toHaveLength(1));
        });
    });

    it('should edit params', async () => {
        render(<RequestEditor />);
        // Params is default tab
        const keyInputs = screen.getAllByPlaceholderText('Key');
        fireEvent.change(keyInputs[0], { target: { value: 'q' } });

        await waitFor(() => expect(requestStore.queryParams).toHaveLength(2));
    });

    it('should remove param row', async () => {
        runInAction(() => {
            requestStore.queryParams = [{ key: 'p1', value: 'v1' }, { key: '', value: '' }];
        });
        render(<RequestEditor />);

        const deleteButtons = screen.getAllByText('✕');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => expect(requestStore.queryParams).toHaveLength(1));
    });

    it('should handle save request', () => {
        runInAction(() => {
            requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
        });
        global.prompt = vi.fn().mockReturnValueOnce('My Request').mockReturnValueOnce('0');
        global.alert = vi.fn();

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(1);
    });

    it('should save to selected collection when multiple exist', () => {
        runInAction(() => {
            requestStore.collections = [
                { id: '1', name: 'Col1', requests: [] },
                { id: '2', name: 'Col2', requests: [] }
            ];
        });
        // First prompt for name, second for collection index (select 1)
        global.prompt = vi.fn().mockReturnValueOnce('My Request').mockReturnValueOnce('1');
        global.alert = vi.fn();

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(1);
        expect(requestStore.collections[1].requests[0].name).toBe('My Request');
    });
});
