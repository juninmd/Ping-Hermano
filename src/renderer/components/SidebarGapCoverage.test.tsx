import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('Sidebar Gap Coverage', () => {
    let originalPrompt;

    beforeEach(() => {
        originalPrompt = window.prompt;
        window.prompt = vi.fn();
        runInAction(() => {
            requestStore.collections = [{
                id: '1',
                name: 'Col1',
                requests: [{
                    id: 'r1',
                    name: 'MyRequest',
                    method: 'GET',
                    url: 'http://test-loaded.com',
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
            requestStore.url = ''; // Reset active URL
        });
    });

    afterEach(() => {
        window.prompt = originalPrompt;
    });

    it('should prompt with default name if request has no name', () => {
        runInAction(() => {
            requestStore.collections[0].requests[0].name = '';
        });

        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');
        fireEvent.click(renameBtn);

        // Verify prompt was called with "New Request" as default value
        expect(window.prompt).toHaveBeenCalledWith(expect.any(String), 'New Request');
    });

    it('should stop propagation when clicking rename request', () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');
        fireEvent.click(renameBtn);

        // Should NOT load the request (url remains empty)
        expect(requestStore.url).toBe('');
    });

    it('should stop propagation when clicking delete request', () => {
         window.confirm = vi.fn().mockReturnValue(false); // Cancel deletion to avoid side effects

         render(<Sidebar />);
         fireEvent.click(screen.getByText('Collections'));

         const deleteBtn = screen.getByTitle('Delete Request');
         fireEvent.click(deleteBtn);

         // Should NOT load the request (url remains empty)
         expect(requestStore.url).toBe('');
    });
});
