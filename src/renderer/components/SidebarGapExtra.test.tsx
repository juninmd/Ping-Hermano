import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    it('should not rename request if prompt is cancelled', () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const renameBtn = screen.getByTitle('Rename Request');

        (global.prompt as any).mockReturnValue(null);

        fireEvent.click(renameBtn);

        expect(requestStore.collections[0].requests[0].name).toBe('Old Name');
    });
});
