import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('RequestEditor Gap Extra Tests', () => {
    const originalElectronAPI = window.electronAPI;

    beforeEach(() => {
        runInAction(() => {
            requestStore.bodyType = 'form-data';
            requestStore.bodyFormData = [{ key: 'file', value: '', type: 'file' }];
        });
        // Remove electronAPI
        // @ts-ignore
        delete window.electronAPI;
    });

    afterEach(() => {
        window.electronAPI = originalElectronAPI;
    });

    it('should use file name as path when electronAPI is not available', () => {
        render(<RequestEditor />);

        // Ensure we are in Body -> Form Data
        fireEvent.click(screen.getByText('Body'));
        // Radio is already checked by store state, but ensure visibility
        // Input is type file
        const fileInput = screen.getAllByPlaceholderText('Key')[0].closest('div')?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

        const file = new File(['content'], 'test.txt', { type: 'text/plain' });
        // Mock the file input change
        fireEvent.change(fileInput, { target: { files: [file] } });

        // Check store
        expect(requestStore.bodyFormData[0].value).toBe('test.txt');
        expect(requestStore.bodyFormData[0].src).toBe('test.txt'); // Fallback behavior
    });
});
