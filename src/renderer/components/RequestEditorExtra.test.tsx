import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

// Mock window.prompt and alert
const originalPrompt = window.prompt;
const originalAlert = window.alert;

describe('RequestEditor Extra Coverage', () => {
    beforeEach(() => {
        window.prompt = vi.fn();
        window.alert = vi.fn();
        runInAction(() => {
            requestStore.collections = [
                { id: 'c1', name: 'Col1', requests: [] },
                { id: 'c2', name: 'Col2', requests: [] }
            ];
            requestStore.method = 'GET';
            requestStore.url = 'http://example.com';
            requestStore.headers = [];
            requestStore.queryParams = [{ key: '', value: '' }];
            requestStore.bodyFormData = [{ key: 'file', value: '', type: 'file' }];
            requestStore.bodyType = 'form-data';
        });
    });

    afterEach(() => {
        window.prompt = originalPrompt;
        window.alert = originalAlert;
        delete (window as any).electronAPI;
    });

    it('should save to selected collection when multiple exist', () => {
        render(<RequestEditor />);

        // Mock prompt BEFORE action
        (window.prompt as any)
            .mockReturnValueOnce('MyReq')
            .mockReturnValueOnce('1');

        // Click Save
        const saveBtns = screen.getAllByText('Save');
        fireEvent.click(saveBtns[0]);

        expect(requestStore.collections[1].requests).toHaveLength(1);
        expect(requestStore.collections[1].requests[0].name).toBe('MyReq');
        expect(window.alert).toHaveBeenCalledWith('Saved!');
    });

    it('should not save if collection index prompt is cancelled', () => {
        render(<RequestEditor />);

        (window.prompt as any)
            .mockReturnValueOnce('MyReq')
            .mockReturnValueOnce(null); // Cancel index selection

        fireEvent.click(screen.getAllByText('Save')[0]);

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
        expect(window.alert).not.toHaveBeenCalledWith('Saved!');
    });

    it('should not save if collection index is invalid', () => {
        render(<RequestEditor />);

        (window.prompt as any)
            .mockReturnValueOnce('MyReq')
            .mockReturnValueOnce('999'); // Invalid index

        fireEvent.click(screen.getAllByText('Save')[0]);

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should use electronAPI.getFilePath if available for file input', () => {
        // Mock electronAPI
        (window as any).electronAPI = {
            getFilePath: vi.fn().mockReturnValue('/path/to/file.txt')
        };

        const { container } = render(<RequestEditor />);

        // Switch to Body tab
        fireEvent.click(screen.getByText('Body'));

        // Find file input
        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toBeTruthy();

        const file = new File(['content'], 'file.txt', { type: 'text/plain' });

        fireEvent.change(fileInput!, { target: { files: [file] } });

        expect((window as any).electronAPI.getFilePath).toHaveBeenCalledWith(file);
        expect(requestStore.bodyFormData[0].src).toBe('/path/to/file.txt');
        expect(requestStore.bodyFormData[0].value).toBe('file.txt');
    });
});
