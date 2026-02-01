import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeSnippetModal } from './CodeSnippetModal';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('CodeSnippetModal Extra Coverage', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = 'http://example.com';
            requestStore.headers = [];
            requestStore.auth = { type: 'none' };
            requestStore.body = '';
            requestStore.bodyType = 'text';
            requestStore.bodyFormData = [];
            requestStore.bodyUrlEncoded = [];
            requestStore.queryParams = [{ key: '', value: '' }];
        });
        vi.restoreAllMocks();
    });

    it('should handle Basic Auth with missing credentials', () => {
        runInAction(() => {
            requestStore.auth = { type: 'basic', username: undefined, password: undefined };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        // btoa(':') is 'Og=='
        expect(screen.getByDisplayValue(/-H "Authorization: Basic Og=="/)).toBeInTheDocument();
    });

    it('should handle Bearer Auth with missing token', () => {
        runInAction(() => {
            requestStore.auth = { type: 'bearer', token: undefined };
        });
        render(<CodeSnippetModal onClose={vi.fn()} />);
        expect(screen.getByDisplayValue(/-H "Authorization: Bearer "/)).toBeInTheDocument();
    });
});
