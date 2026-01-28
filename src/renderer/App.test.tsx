import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { requestStore } from './stores/RequestStore';

// Mock window.electronAPI
const mockMakeRequest = vi.fn();
Object.defineProperty(window, 'electronAPI', {
  value: {
    makeRequest: mockMakeRequest
  },
  writable: true
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        clear: vi.fn(),
        removeItem: vi.fn(),
    },
    writable: true
});


describe('App Integration', () => {
    beforeEach(() => {
        // Reset store
        requestStore.method = 'GET';
        requestStore.url = '';
        requestStore.headers = [{ key: '', value: '' }];
        requestStore.response = null;
        requestStore.loading = false;

        vi.clearAllMocks();
    });

    it('should render the app', () => {
        render(<App />);
        expect(screen.getByPlaceholderText(/Enter request URL/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    });

    it('should update store when user types URL', async () => {
        const user = userEvent.setup();
        render(<App />);

        const input = screen.getByPlaceholderText(/Enter request URL/i);
        await user.type(input, 'https://example.com/api');

        expect(requestStore.url).toBe('https://example.com/api');
    });

    it('should call makeRequest when Send is clicked', async () => {
        const user = userEvent.setup();
        requestStore.setUrl('https://test-api.com');

        mockMakeRequest.mockResolvedValueOnce({
            status: 200,
            data: { message: "Hello World" },
            headers: {}
        });

        render(<App />);

        // Use getByRole to target the button specifically, avoiding ambiguity with the placeholder text
        const sendButton = screen.getByRole('button', { name: /Send/i });
        await user.click(sendButton);

        expect(mockMakeRequest).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://test-api.com',
            method: 'GET'
        }));

        await waitFor(() => {
             // Depending on how ResponseViewer displays data.
             // We can check if "Hello World" appears if it's rendered.
             // But for now, verifying the mock call is the key integration point.
             expect(requestStore.response).not.toBeNull();
        });
    });

    it('should resize sidebar', async () => {
        vi.clearAllMocks(); // Clear initial calls
        render(<App />);
        const handle = screen.getByTestId('resize-handle-horizontal');

        fireEvent.mouseDown(handle, { clientX: 300 });
        fireEvent.mouseMove(window, { clientX: 400 });
        fireEvent.mouseUp(window);

        // We can verify localStorage was called to save 'sidebarWidth'
        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalledWith('sidebarWidth', '400');
        });
    });

    it('should resize response panel', async () => {
        vi.clearAllMocks();
        render(<App />);
        const handle = screen.getByTestId('resize-handle-vertical');

        // Initial height 300. Dragging UP (clientY decreases), diff is positive, height increases.
        // startY = 500, moveY = 400. diff = 100. newHeight = 300 + 100 = 400.

        fireEvent.mouseDown(handle, { clientY: 500 });
        fireEvent.mouseMove(window, { clientY: 400 });
        fireEvent.mouseUp(window);

        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalledWith('responseHeight', '400');
        });
    });

    it('should load saved layout from localStorage', async () => {
        (window.localStorage.getItem as any).mockImplementation((key: string) => {
            if (key === 'sidebarWidth') return '500';
            if (key === 'responseHeight') return '600';
            return null;
        });
        vi.clearAllMocks();

        render(<App />);

        const handle = screen.getByTestId('resize-handle-horizontal');

        // Now interaction should use the updated width (500) as start
        fireEvent.mouseDown(handle, { clientX: 500 });
        fireEvent.mouseMove(window, { clientX: 510 });
        fireEvent.mouseUp(window);

        await waitFor(() => {
            expect(window.localStorage.setItem).toHaveBeenCalledWith('sidebarWidth', '510');
        });
    });
});
