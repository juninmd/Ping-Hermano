import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('Sidebar Rename Coverage', () => {
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
        window.prompt = originalPrompt;
    });

    it('should rename request when prompt is confirmed', () => {
        render(<Sidebar />);

        // Open Collections tab
        fireEvent.click(screen.getByText('Collections'));

        // Mock prompt to return new name
        (window.prompt as any).mockReturnValue('New Name');

        // Find rename button. It's an ActionBtn with title "Rename Request"
        const renameBtn = screen.getByTitle('Rename Request');
        fireEvent.click(renameBtn);

        expect(requestStore.collections[0].requests[0].name).toBe('New Name');
    });
});
