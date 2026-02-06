import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';

// Mock dependencies
vi.mock('../stores/RequestStore', async () => {
    const actual = await vi.importActual('../stores/RequestStore');
    return {
        ...actual,
        requestStore: new (actual as any).RequestStore()
    };
});

describe('FinalGapCoverage', () => {
    let promptSpy: any;
    let alertSpy: any;
    let confirmSpy: any;

    beforeEach(() => {
        promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => null);
        alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

        // Reset store
        runInAction(() => {
            requestStore.collections = [];
            requestStore.environments = [];
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('RequestEditor', () => {
        it('should not save if collection selection is cancelled (prompt returns null)', () => {
            // Setup multiple collections to trigger the index prompt
            runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col 1', requests: [] },
                    { id: '2', name: 'Col 2', requests: [] }
                ];
            });

            // Mock prompt: First call (Name) -> "Req", Second call (Index) -> null
            promptSpy.mockImplementationOnce(() => "Req Name").mockImplementationOnce(() => null);

            render(<RequestEditor />);

            const saveBtn = screen.getByText('Save');
            fireEvent.click(saveBtn);

            expect(promptSpy).toHaveBeenCalledTimes(2);
            // Verify no request was added
            expect(requestStore.collections[0].requests).toHaveLength(0);
            expect(requestStore.collections[1].requests).toHaveLength(0);
        });

        it('should not save if collection index is invalid', () => {
             // Setup multiple collections
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col 1', requests: [] },
                    { id: '2', name: 'Col 2', requests: [] }
                ];
            });

            // Mock prompt: Name -> "Req", Index -> "99" (invalid)
            promptSpy.mockImplementationOnce(() => "Req Name").mockImplementationOnce(() => "99");

            render(<RequestEditor />);

            const saveBtn = screen.getByText('Save');
            fireEvent.click(saveBtn);

            expect(promptSpy).toHaveBeenCalledTimes(2);
            // Verify no request was added
            expect(requestStore.collections[0].requests).toHaveLength(0);
            expect(requestStore.collections[1].requests).toHaveLength(0);
        });

        it('should remove form data item', () => {
            render(<RequestEditor />);

            // Switch to Body tab and select Form Data
            fireEvent.click(screen.getByText('Body'));
            fireEvent.click(screen.getByText('Form Data'));

            // There should be one empty row initially
            const inputs = screen.getAllByPlaceholderText('Key');
            expect(inputs).toHaveLength(1);

            // Add a new row by typing in the last one
            fireEvent.change(inputs[0], { target: { value: 'key1' } });

            // Now there should be two rows
            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(2);

            // Click remove button on the first row
            const removeBtns = screen.getAllByText('✕');
            expect(removeBtns).toHaveLength(1); // Only the first row has remove button, the last empty one doesn't

            fireEvent.click(removeBtns[0]);

            // Should be back to 1 row (the empty one)
            expect(screen.getAllByPlaceholderText('Key')).toHaveLength(1);
        });
    });

    describe('Sidebar', () => {
        it('should alert if environment import fails (invalid JSON)', async () => {
             render(<Sidebar />);

             // Switch to Environments tab
             fireEvent.click(screen.getByText('Envs'));

             const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
             expect(fileInput).toBeInTheDocument();

             // Mock FileReader to return invalid JSON
             const file = new File(['invalid-json'], 'env.json', { type: 'application/json' });

             Object.defineProperty(fileInput, 'files', {
                 value: [file]
             });

             fireEvent.change(fileInput);

             await waitFor(() => {
                 expect(alertSpy).toHaveBeenCalledWith('Failed to import environments. Invalid format?');
             });
        });

        it('should not rename request if prompt is cancelled', () => {
            // Setup collection with request
            runInAction(() => {
                requestStore.collections = [
                    {
                        id: '1',
                        name: 'Col 1',
                        requests: [{
                            id: 'r1',
                            name: 'Original Name',
                            method: 'GET',
                            url: 'http://test.com',
                            date: ''
                        }]
                    }
                ];
            });

            promptSpy.mockReturnValue(null);

            render(<Sidebar />);
            fireEvent.click(screen.getByText('Collections'));

            // Find rename button (pencil) for the request
            // The first pencil is for collection, second is for request
            const pencils = screen.getAllByTitle('Rename Request');
            fireEvent.click(pencils[0]);

            expect(requestStore.collections[0].requests[0].name).toBe('Original Name');
        });
    });
});
