import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInAction } from 'mobx';

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
            requestStore.history = [];
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
        it('should alert if collection import fails (invalid JSON)', async () => {
            render(<Sidebar />);

            // Ensure we are on Collections tab
            fireEvent.click(screen.getByText('Collections'));

            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toBeInTheDocument();

            // Mock FileReader to return invalid JSON
            const file = new File(['invalid-json'], 'col.json', { type: 'application/json' });

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });

            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Failed to import collections. Invalid format?');
            });
        });

        it('should alert if environment import fails (invalid JSON)', async () => {
             render(<Sidebar />);

             // Switch to Environments tab
             fireEvent.click(screen.getByText('Envs'));

             // Note: There are two file inputs now (one for collections, one for envs).
             // Since they are hidden, we rely on the active tab showing the correct one?
             // Actually, both are rendered but maybe only one is visible or we need to pick the right one.
             // The Sidebar implementation has both inputs rendered always in their respective tab blocks.
             // Since we switched tab, the environments one should be the one we interact with.
             // But wait, `document.querySelector` might pick the first one which is collections input if both are present in DOM?
             // Let's use `getAllByTitle` or similar to target the specific input or button.
             // The inputs are hidden `display: none`.
             // In Sidebar.tsx:
             // Collections input: ref={collectionFileInput}
             // Environments input: ref={envFileInput}

             // We can select by ref if we could, but we can't in tests easily.
             // We can assume that since we switched tab, we should look for the input associated with "Import Environments" button.
             // But the inputs are just generic <input type="file" ... />.
             // The environment input is inside the `activeTab === 'environments'` block.
             // The collection input is inside the `activeTab === 'collections'` block.
             // So `screen.getByTitle('Import Environments')` is the button. The input is previous sibling?
             // Or we can just use `container.querySelectorAll('input[type="file"]')` and pick the second one if both are rendered?
             // Wait, `activeTab` logic in `Sidebar` creates/destroys the DOM elements for that tab.
             // So if we are on 'Envs' tab, ONLY the environment input should be in the DOM (if Sidebar structure removes other tabs content).

             // Let's check `Sidebar.tsx`.
             // `{activeTab === 'collections' && ( ... )}`
             // `{activeTab === 'environments' && ( ... )}`
             // So ONLY ONE input is present at a time.
             // So `document.querySelector('input[type="file"]')` should work!

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
                            date: '',
                            headers: []
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

        it('should create environment via button', () => {
            render(<Sidebar />);
            fireEvent.click(screen.getByText('Envs'));

            promptSpy.mockReturnValue('New Env');

            const addBtn = screen.getByTitle('New Environment');
            fireEvent.click(addBtn);

            expect(requestStore.environments).toHaveLength(1);
            expect(requestStore.environments[0].name).toBe('New Env');
        });

        it('should create collection via button', () => {
            render(<Sidebar />);
            fireEvent.click(screen.getByText('Collections'));

            promptSpy.mockReturnValue('New Col');

            const addBtn = screen.getByTitle('New Collection');
            fireEvent.click(addBtn);

            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('New Col');
        });
    });
});
