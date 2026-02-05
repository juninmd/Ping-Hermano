import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('Sidebar Gap Extra Tests', () => {
    beforeEach(() => {
        global.prompt = vi.fn();
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
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should not rename request if prompt is cancelled', () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');

        (global.prompt as any).mockReturnValue(null);

        fireEvent.click(renameBtn);

        expect(requestStore.collections[0].requests[0].name).toBe('Old Name');
    });

    it('should alert on successful collection import', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const fileInput = screen.getByTitle('Import Collections').previousElementSibling as HTMLInputElement;
        const file = new File(['[{"id":"1","name":"Test","requests":[]}]'], 'test.json', { type: 'application/json' });

        // Mock FileReader
        const MockFileReader = class {
            onload: any;
            readAsText(f: any) {
                this.onload({ target: { result: '[{"id":"1","name":"Test","requests":[]}]' } });
            }
        };
        vi.stubGlobal('FileReader', MockFileReader);

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(alertSpy).toHaveBeenCalledWith('Collections imported successfully!');
    });

    it('should alert on successful environment import', async () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Envs'));

        const fileInput = screen.getByTitle('Import Environments').previousElementSibling as HTMLInputElement;
        const file = new File(['[{"id":"1","name":"Test","variables":[]}]'], 'test.json', { type: 'application/json' });

        // Mock FileReader
        const MockFileReader = class {
            onload: any;
            readAsText(f: any) {
                this.onload({ target: { result: '[{"id":"1","name":"Test","variables":[]}]' } });
            }
        };
        vi.stubGlobal('FileReader', MockFileReader);

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

        fireEvent.change(fileInput, { target: { files: [file] } });

        expect(alertSpy).toHaveBeenCalledWith('Environments imported successfully!');
    });
});
