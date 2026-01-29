import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

describe('App Coverage Gaps', () => {
    it('should cover startResizeResponse interaction', async () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
        render(<App />);

        const handle = screen.getByTestId('resize-handle-vertical');

        // Mouse Down
        fireEvent.mouseDown(handle, { clientY: 500 });

        // Mouse Move
        fireEvent.mouseMove(window, { clientY: 400 });

        // Mouse Up
        fireEvent.mouseUp(window);

        await waitFor(() => {
             expect(setItemSpy).toHaveBeenCalledWith('responseHeight', expect.any(String));
        });

        setItemSpy.mockRestore();
    });
});
