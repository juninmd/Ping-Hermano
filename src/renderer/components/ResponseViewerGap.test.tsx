import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResponseViewer } from './ResponseViewer';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('ResponseViewer Gap Tests', () => {
    beforeEach(() => {
        runInAction(() => {
             requestStore.response = {
                 status: 200,
                 statusText: 'OK',
                 headers: {},
                 data: { foo: 'bar' },
                 testResults: []
             };
             requestStore.loading = false;
             requestStore.error = null;
        });
    });

    it('should handle clicking Body tab when not active', () => {
        render(<ResponseViewer />);

        // Switch to headers
        fireEvent.click(screen.getByText('Headers'));

        // Switch back to Body
        const bodyTab = screen.getByText('Body');
        fireEvent.click(bodyTab);

        // Check that body is visible (implicit check by finding element that is only in body tab)
        // Since we have data { foo: 'bar' }, formatted body should be present
        const bodyArea = screen.getByRole('textbox', { name: '' });
        expect(bodyArea).toBeInTheDocument();
        expect(bodyArea).toHaveValue('{\n  "foo": "bar"\n}');
    });
});
