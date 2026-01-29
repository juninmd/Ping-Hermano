import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RequestEditor from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import { runInAction } from 'mobx';

// Mock mobx-react-lite to just return component
vi.mock('mobx-react-lite', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        observer: (component: any) => component,
    };
});

describe('RequestEditor Coverage', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.addTab(); // Ensure active tab
            requestStore.collections = [];
            requestStore.history = [];
        });
        vi.clearAllMocks();
    });

    it('should alert if save clicked with no collections', () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<RequestEditor />);

        fireEvent.click(screen.getByText('Save'));

        expect(alertMock).toHaveBeenCalledWith('Create a collection first!');
    });

    it('should handle cancel on request name prompt', () => {
        runInAction(() => {
            requestStore.createCollection('My Col');
        });
        const promptMock = vi.spyOn(window, 'prompt').mockReturnValue(null);

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(promptMock).toHaveBeenCalledWith('Enter request name:');
        expect(requestStore.collections[0].requests).toHaveLength(0);
    });

    it('should save directly if only one collection exists', () => {
        runInAction(() => {
            requestStore.createCollection('My Col');
        });

        // Mock prompt: just for name ("My Req")
        const promptMock = vi.spyOn(window, 'prompt').mockReturnValue('My Req');
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(alertMock).toHaveBeenCalledWith('Saved!');
        expect(requestStore.collections[0].requests).toHaveLength(1);
        expect(requestStore.collections[0].requests[0].name).toBe('My Req');
    });

    it('should handle multiple collections save flow - select invalid index', () => {
        runInAction(() => {
            requestStore.createCollection('Col 1');
            requestStore.createCollection('Col 2');
        });

        // Mock prompts: first for name ("My Req"), second for index ("invalid")
        const promptMock = vi.spyOn(window, 'prompt')
            .mockReturnValueOnce('My Req')
            .mockReturnValueOnce('invalid');

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should handle multiple collections save flow - cancel index selection', () => {
        runInAction(() => {
            requestStore.createCollection('Col 1');
            requestStore.createCollection('Col 2');
        });

        // Mock prompts: first for name ("My Req"), second for index (null - cancel)
        const promptMock = vi.spyOn(window, 'prompt')
            .mockReturnValueOnce('My Req')
            .mockReturnValueOnce(null);

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should handle multiple collections save flow - select valid index', () => {
        runInAction(() => {
            requestStore.createCollection('Col 1');
            requestStore.createCollection('Col 2');
        });

        // Mock prompts: first for name ("My Req"), second for index ("1")
        const promptMock = vi.spyOn(window, 'prompt')
            .mockReturnValueOnce('My Req')
            .mockReturnValueOnce('1');

        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        expect(alertMock).toHaveBeenCalledWith('Saved!');
        expect(requestStore.collections).toHaveLength(2);
        expect(requestStore.collections[1].requests).toHaveLength(1);
        expect(requestStore.collections[1].requests[0].name).toBe('My Req');
    });

    it('should remove header when remove button clicked', () => {
        runInAction(() => {
            requestStore.headers = [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Accept', value: '*/*' },
                { key: '', value: '' } // Empty last row
            ];
        });
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/^Headers/)); // Switch tab

        // Click remove button for first item
        const removeBtns = screen.getAllByText('✕');
        fireEvent.click(removeBtns[0]);

        expect(requestStore.headers).toHaveLength(2);
        expect(requestStore.headers[0].key).toBe('Accept');
    });

    it('should remove param when remove button clicked', () => {
        runInAction(() => {
            requestStore.queryParams = [
                { key: 'page', value: '1' },
                { key: 'limit', value: '10' },
                { key: '', value: '' }
            ];
        });
        render(<RequestEditor />);
        // Params tab is default active

        const removeBtns = screen.getAllByText('✕');
        fireEvent.click(removeBtns[0]);

        expect(requestStore.queryParams).toHaveLength(2);
        expect(requestStore.queryParams[0].key).toBe('limit');
    });

    it('should remove form-data item when remove button clicked', () => {
        runInAction(() => {
            requestStore.bodyType = 'form-data';
            requestStore.bodyFormData = [
                { key: 'field1', value: 'value1', type: 'text' },
                { key: 'field2', value: 'value2', type: 'text' },
                { key: '', value: '', type: 'text' }
            ];
        });
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body')); // Switch to Body

        const removeBtns = screen.getAllByText('✕');
        fireEvent.click(removeBtns[0]);

        expect(requestStore.bodyFormData).toHaveLength(2);
        expect(requestStore.bodyFormData[0].key).toBe('field2');
    });

    it('should remove url-encoded item when remove button clicked', () => {
        runInAction(() => {
            requestStore.bodyType = 'x-www-form-urlencoded';
            requestStore.bodyUrlEncoded = [
                { key: 'field1', value: 'value1' },
                { key: 'field2', value: 'value2' },
                { key: '', value: '' }
            ];
        });
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Body')); // Switch to Body

        const removeBtns = screen.getAllByText('✕');
        fireEvent.click(removeBtns[0]);

        expect(requestStore.bodyUrlEncoded).toHaveLength(2);
        expect(requestStore.bodyUrlEncoded[0].key).toBe('field2');
    });
});
