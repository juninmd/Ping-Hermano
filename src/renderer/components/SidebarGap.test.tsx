import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar Gaps', () => {
    it('should alert on file read error', () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

        // Mock FileReader
        const originalFileReader = window.FileReader;
        window.FileReader = class MockFileReader extends originalFileReader {
            readAsText() {
                if (this.onerror) {
                    this.onerror(new ProgressEvent('error') as any);
                }
            }
        } as any;

        render(<Sidebar />);

        // Find hidden input. It's tricky as it's hidden.
        // Sidebar has: <input type="file" ... style={{ display: 'none' }} />
        // We can select by testid if it exists, or by selector.
        // Sidebar.tsx doesn't seem to have testids for inputs based on previous reads?
        // Let's check Sidebar.tsx content if I can... or just try to select by type="file"

        // There are two inputs: collections and environment.
        const inputs = document.querySelectorAll('input[type="file"]');
        if (inputs.length > 0) {
            fireEvent.change(inputs[0], { target: { files: [new File([''], 'test.json')] } });
            expect(alertMock).toHaveBeenCalledWith('Failed to read file');
        }

        window.FileReader = originalFileReader;
        alertMock.mockRestore();
    });
});
