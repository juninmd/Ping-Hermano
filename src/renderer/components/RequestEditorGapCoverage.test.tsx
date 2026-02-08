import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runInAction } from 'mobx';
import RequestEditor from './RequestEditor';
import { requestStore } from '../stores/RequestStore';

describe('RequestEditor Gap Coverage', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.collections = [];
        });
        vi.clearAllMocks();
    });

    it('should save to the only collection without prompting for index', () => {
        runInAction(() => {
            requestStore.createCollection('OnlyCollection');
        });

        // Mock prompt to return name
        const promptMock = vi.spyOn(window, 'prompt').mockReturnValue('My Request');
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        // Should call prompt only ONCE (for name)
        expect(promptMock).toHaveBeenCalledTimes(1);
        expect(alertMock).toHaveBeenCalledWith('Saved!');
        expect(requestStore.collections[0].requests).toHaveLength(1);

        promptMock.mockRestore();
        alertMock.mockRestore();
    });

    it('should handle collection index out of bounds', () => {
        runInAction(() => {
            requestStore.createCollection('Col1');
            requestStore.createCollection('Col2');
        });

        // Mock prompt: Name -> "999" (out of bounds)
        const promptMock = vi.spyOn(window, 'prompt')
            .mockReturnValueOnce('My Request')
            .mockReturnValueOnce('999');

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(promptMock).toHaveBeenCalledTimes(2);
        // Should NOT save
        expect(alertMock).not.toHaveBeenCalledWith('Saved!');
        expect(requestStore.collections[0].requests).toHaveLength(0);

        promptMock.mockRestore();
        alertMock.mockRestore();
    });

    it('should handle invalid collection index (NaN)', () => {
        runInAction(() => {
            requestStore.createCollection('Col1');
            requestStore.createCollection('Col2');
        });

        // Mock prompt: Name -> "abc" (invalid index)
        const promptMock = vi.spyOn(window, 'prompt')
            .mockReturnValueOnce('My Request')
            .mockReturnValueOnce('abc');

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(promptMock).toHaveBeenCalledTimes(2);
        // Should NOT save
        expect(alertMock).not.toHaveBeenCalledWith('Saved!');
        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);

        promptMock.mockRestore();
        alertMock.mockRestore();
    });
});
