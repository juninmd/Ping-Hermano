import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

describe('RequestEditor Gap Scripts Tests', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.preRequestScript = '';
            requestStore.testScript = '';
        });
    });

    it('should update pre-request script', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Pre-req'));

        const editor = screen.getByPlaceholderText('// Write your pre-request script here');
        fireEvent.change(editor, { target: { value: 'console.log("pre")' } });

        expect(requestStore.preRequestScript).toBe('console.log("pre")');
    });

    it('should update test script', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Tests'));

        const editor = screen.getByPlaceholderText(/Write your tests here/);
        fireEvent.change(editor, { target: { value: 'pm.test("pass")' } });

        expect(requestStore.testScript).toBe('pm.test("pass")');
    });
});
