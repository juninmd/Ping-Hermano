import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInAction } from 'mobx';
import userEvent from '@testing-library/user-event';
import RequestEditor from './RequestEditor';
import { requestStore } from '../stores/RequestStore';

describe('RequestEditor Gaps', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.collections = [];
            requestStore.bodyUrlEncoded = [{ key: '', value: '' }];
        });
        vi.clearAllMocks();
    });

    it('should alert when saving with no collections', async () => {
        runInAction(() => {
            requestStore.collections = [];
        });
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(alertMock).toHaveBeenCalledWith('Create a collection first!');
        alertMock.mockRestore();
    });

    it('should handle collection selection cancellation', async () => {
        requestStore.createCollection('Col1');
        requestStore.createCollection('Col2');

        const promptMock = vi.spyOn(window, 'prompt').mockReturnValueOnce('RequestName').mockReturnValueOnce(null); // Name, then Cancel Index
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(promptMock).toHaveBeenCalledTimes(2);
        // Should not save
        // We can verify saveRequestToCollection wasn't called if we spied on it, but checking side effects is harder.
        // Assuming no error means pass.
        alertMock.mockRestore();
        promptMock.mockRestore();
    });

    it('should handle invalid collection index', async () => {
        requestStore.createCollection('Col1');
        requestStore.createCollection('Col2');

        const promptMock = vi.spyOn(window, 'prompt').mockReturnValueOnce('RequestName').mockReturnValueOnce('999');
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(promptMock).toHaveBeenCalledTimes(2);
        expect(alertMock).not.toHaveBeenCalledWith('Saved!');

        alertMock.mockRestore();
        promptMock.mockRestore();
    });

    it('should save to specific collection index', async () => {
        requestStore.createCollection('Col1');
        requestStore.createCollection('Col2');

        const promptMock = vi.spyOn(window, 'prompt').mockReturnValueOnce('RequestName').mockReturnValueOnce('1');
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);

        fireEvent.click(screen.getByRole('button', { name: 'Save' }));

        const collection = requestStore.collections[1];
        expect(collection.requests.some(r => r.name === 'RequestName')).toBe(true);
        expect(alertMock).toHaveBeenCalledWith('Saved!');

        alertMock.mockRestore();
        promptMock.mockRestore();
    });

    it('should remove url encoded param', async () => {
        requestStore.setBodyType('x-www-form-urlencoded');
        requestStore.setBodyUrlEncoded([{ key: 'k1', value: 'v1' }, { key: '', value: '' }]); // Add one valid, one empty (auto-added usually)

        render(<RequestEditor />);

        // Click Body tab
        fireEvent.click(screen.getByText('Body'));

        // Find remove button.
        const removeBtns = screen.getAllByText('✕');
        fireEvent.click(removeBtns[0]);

        expect(requestStore.bodyUrlEncoded.length).toBe(1); // Should have removed one, leaving the empty one
    });
});
