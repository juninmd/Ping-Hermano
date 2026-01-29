import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('Final Coverage Tests', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.collections = [];
            requestStore.environments = [];
        });
        vi.clearAllMocks();
        global.alert = vi.fn();
        global.prompt = vi.fn();
    });

    it('should import collections successfully', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const fileInput = screen.getByTitle('Import Collections').parentElement!.querySelector('input[type="file"]') as HTMLInputElement;

        const validCollection = [{
            id: '1',
            name: 'Imported Col',
            requests: []
        }];

        const file = new File([JSON.stringify(validCollection)], 'col.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('Imported Col');
            expect(global.alert).toHaveBeenCalledWith('Collections imported successfully!');
        });
    });

    it('should import environments successfully', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Envs'));

        const fileInput = screen.getByTitle('Import Environments').parentElement!.querySelector('input[type="file"]') as HTMLInputElement;

        const validEnv = [{
            id: '1',
            name: 'Imported Env',
            variables: []
        }];

        const file = new File([JSON.stringify(validEnv)], 'env.json', { type: 'application/json' });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(requestStore.environments).toHaveLength(1);
            expect(requestStore.environments[0].name).toBe('Imported Env');
            expect(global.alert).toHaveBeenCalledWith('Environments imported successfully!');
        });
    });

    it('should rename request in collection', () => {
        runInAction(() => {
            requestStore.collections = [{
                id: '1',
                name: 'Col1',
                requests: [{
                    id: 'r1',
                    name: 'Old Name',
                    method: 'GET',
                    url: 'http://test',
                    headers: [],
                    body: '',
                    bodyFormData: [],
                    bodyUrlEncoded: [],
                    bodyType: 'text',
                    auth: { type: 'none' },
                    preRequestScript: '',
                    testScript: '',
                    date: ''
                }]
            }];
        });

        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');

        // Mock prompt
        (global.prompt as any).mockReturnValue('New Name');

        fireEvent.click(renameBtn);

        expect(requestStore.collections[0].requests[0].name).toBe('New Name');
    });

    it('should send request with API Key in Header', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'X-Key', value: '123', addTo: 'header' }
            };
        });

        // Mock makeRequest
        const makeRequestSpy = vi.fn().mockResolvedValue({ status: 200, data: 'ok' });
        window.electronAPI = { makeRequest: makeRequestSpy } as any;

        await requestStore.sendRequest();

        expect(makeRequestSpy).toHaveBeenCalledWith(expect.objectContaining({
            headers: expect.arrayContaining([{ key: 'X-Key', value: '123' }])
        }));
    });

    it('should send request with API Key in Query', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'api_key', value: '123', addTo: 'query' }
            };
        });

        const makeRequestSpy = vi.fn().mockResolvedValue({ status: 200, data: 'ok' });
        window.electronAPI = { makeRequest: makeRequestSpy } as any;

        await requestStore.sendRequest();

        expect(makeRequestSpy).toHaveBeenCalledWith(expect.objectContaining({
            url: 'http://api.com?api_key=123'
        }));
    });

     it('should send request with Environment Variables', async () => {
        runInAction(() => {
            requestStore.url = 'http://api.com';
            requestStore.environments = [{
                id: 'e1',
                name: 'Env1',
                variables: [{ key: 'var1', value: 'val1', enabled: true }]
            }];
            requestStore.activeEnvironmentId = 'e1';
        });

        const makeRequestSpy = vi.fn().mockResolvedValue({ status: 200, data: 'ok' });
        window.electronAPI = { makeRequest: makeRequestSpy } as any;

        await requestStore.sendRequest();

        expect(makeRequestSpy).toHaveBeenCalledWith(expect.objectContaining({
            environment: { var1: 'val1' }
        }));
    });
});
