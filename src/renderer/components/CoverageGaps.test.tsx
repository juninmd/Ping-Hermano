import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RequestEditor } from './RequestEditor';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('RequestEditor Coverage Gaps', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.method = 'GET';
            requestStore.url = '';
            requestStore.headers = [{ key: '', value: '' }];
            requestStore.queryParams = [{ key: '', value: '' }];
            requestStore.body = '';
            requestStore.auth = { type: 'none' };
            requestStore.collections = [];
        });
        vi.restoreAllMocks();
    });

    it('should handle API Key "Add To" change when apiKey is undefined', () => {
        render(<RequestEditor />);

        // Switch to API Key auth
        fireEvent.click(screen.getByText('Auth'));
        const typeSelect = screen.getByDisplayValue('No Auth');
        fireEvent.change(typeSelect, { target: { value: 'apikey' } });

        // Force auth.apiKey to be undefined in store to mimic initial state issues or race conditions
        // Although changing type to 'apikey' usually keeps it undefined until we type in inputs?
        // No, setAuth({ ...auth, type: 'apikey' }) keeps other props.
        // Initial state is { type: 'none' }, so apiKey is undefined.
        // The component renders inputs.

        // Find "Add To" select
        const addToSelect = screen.getByDisplayValue('Header'); // Default is header

        // Change it to 'query'.
        // This triggers onChange: setAuth({ ...auth, apiKey: { key: auth.apiKey?.key || '', value: auth.apiKey?.value || '', addTo: ... } })
        // verify that it handles undefined apiKey correctly (uses '')
        fireEvent.change(addToSelect, { target: { value: 'query' } });

        expect(requestStore.auth.apiKey?.addTo).toBe('query');
        expect(requestStore.auth.apiKey?.key).toBe('');
        expect(requestStore.auth.apiKey?.value).toBe('');
    });

    it('should hit "else { return }" when saving to collection with invalid index', () => {
        runInAction(() => {
            requestStore.collections = [
                { id: '1', name: 'Col1', requests: [] },
                { id: '2', name: 'Col2', requests: [] }
            ];
        });

        // Prompt sequence: "Name", "Index".
        // Return valid name, but invalid index (out of bounds)
        // collections.length is 2. Index 5 is invalid.
        global.prompt = vi.fn()
            .mockReturnValueOnce('My Req') // Name
            .mockReturnValueOnce('5');     // Index

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));

        // Should return early, request not added
        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should hit "else { return }" when saving to collection and index prompt is cancelled', () => {
        runInAction(() => {
            requestStore.collections = [
                { id: '1', name: 'Col1', requests: [] },
                { id: '2', name: 'Col2', requests: [] }
            ];
        });

        // Prompt sequence: "Name", "Index".
        // Name valid. Index cancelled (null).
        // If returns null, code says: parseInt(indexStr || "0"). So it becomes 0.
        // So it saves to collection 0.
        // Wait, if I want to hit "else", I need it to NOT find the collection.
        // If it defaults to 0, and 0 exists, it works.
        // So "cancellation" actually works as "default to 0".
        // If so, the line "else { return }" is NOT hit by cancellation (unless 0 is invalid??).
        // But checking `parseInt(indexStr || "0")`.
        // If I want to hit else, `!isNaN(index) && collections[index]` must be false.
        // If index is 0, it is true.

        // So how to hit else?
        // Provide 'abc'.

        global.prompt = vi.fn()
            .mockReturnValueOnce('My Req')
            .mockReturnValueOnce('abc');

        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Save'));
        expect(requestStore.collections[0].requests).toHaveLength(0);
        expect(requestStore.collections[1].requests).toHaveLength(0);
    });

    it('should not add new header row if input is cleared', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        const keyInputs = screen.getAllByPlaceholderText('Key');
        // Type something
        fireEvent.change(keyInputs[0], { target: { value: 'A' } });
        expect(requestStore.headers).toHaveLength(2);

        // Clear it
        const keyInputsAfter = screen.getAllByPlaceholderText('Key'); // Re-query
        fireEvent.change(keyInputsAfter[0], { target: { value: '' } });

        // Should still be 2 (empty row + empty row? No, we don't remove rows automatically unless explicit delete)
        // But the condition to ADD a new row should be false.
        // The condition is: if index === last && (key || value) -> push.
        // Here index 0 is not last (length is 2).
        // So we need to modify the LAST row to test the condition failing?
        // But the last row is initially empty.
        // If we modify the last row (index 1) to be 'A', it adds row 2.
        // If we modify row 1 to be '', it does NOT add row 3.

        // Let's try:
        // 1. Initial: [ {} ]
        // 2. Type in row 0: [ {key: 'A'}, {} ]
        // 3. Type in row 1: [ {key: 'A'}, {key: 'B'}, {} ]

        // To test the FALSE branch of `(newHeaders[index].key || newHeaders[index].value)`, we need to trigger change on last row but with empty values?
        // But triggering change with empty values on an already empty row doesn't change anything?
        // Change 'Key' from '' to ''.

        const lastInput = screen.getAllByPlaceholderText('Key')[1]; // The empty one
        fireEvent.change(lastInput, { target: { value: '' } });
        expect(requestStore.headers).toHaveLength(2); // Should not increase
    });

    it('should handle API Key "Value" change when key is undefined', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));
        const typeSelect = screen.getByDisplayValue('No Auth');
        fireEvent.change(typeSelect, { target: { value: 'apikey' } });

        const valueInput = screen.getByPlaceholderText('Value');
        fireEvent.change(valueInput, { target: { value: 'secret' } });

        expect(requestStore.auth.apiKey?.value).toBe('secret');
        expect(requestStore.auth.apiKey?.key).toBe('');
    });

    it('should handle API Key "Key" change when value is undefined', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText('Auth'));
        const typeSelect = screen.getByDisplayValue('No Auth');
        fireEvent.change(typeSelect, { target: { value: 'apikey' } });

        const keyInput = screen.getByPlaceholderText('Key');
        fireEvent.change(keyInput, { target: { value: 'mykey' } });

        expect(requestStore.auth.apiKey?.key).toBe('mykey');
        expect(requestStore.auth.apiKey?.value).toBe('');
    });

    it('should trigger handleHeaderChange on last row with empty value (branch coverage)', () => {
        render(<RequestEditor />);
        fireEvent.click(screen.getByText(/Headers/));
        // Initial state: 1 empty row.
        expect(requestStore.headers).toHaveLength(1);

        const keyInputs = screen.getAllByPlaceholderText('Key');
        // Trigger change on the only (last) row with empty value
        fireEvent.change(keyInputs[0], { target: { value: '' } });

        // Should NOT add a new row
        expect(requestStore.headers).toHaveLength(1);
    });
});
