import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock mobx-react-lite to just render the component
vi.mock('mobx-react-lite', async () => {
    const actual = await vi.importActual('mobx-react-lite');
    return {
        ...actual as any,
        observer: (component: any) => component,
    };
});

describe('Sidebar Export', () => {
    let originalCreateElement: any;

    beforeEach(() => {
        // Mock URL.createObjectURL and revokeObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
        global.URL.revokeObjectURL = vi.fn();
        originalCreateElement = document.createElement.bind(document);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should export collections', () => {
        // Setup store
        requestStore.createCollection('Export Col');

        // Mock anchor click
        const clickMock = vi.fn();
        const linkMock = {
            href: '',
            download: '',
            click: clickMock,
        } as unknown as HTMLAnchorElement;

        vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
            if (tagName === 'a') return linkMock;
            return originalCreateElement(tagName, options);
        });

        render(<Sidebar />);

        // Switch to Collections tab
        fireEvent.click(screen.getByText('Collections'));

        // Find and click Export button
        const exportBtn = screen.getByTitle('Export Collections');
        fireEvent.click(exportBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(linkMock.click).toHaveBeenCalled();
        expect(linkMock.download).toContain('collections_');
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should export environments', () => {
        // Setup store
        requestStore.createEnvironment('Export Env');

        // Mock anchor click
        const clickMock = vi.fn();
        const linkMock = {
            href: '',
            download: '',
            click: clickMock,
        } as unknown as HTMLAnchorElement;

        vi.spyOn(document, 'createElement').mockImplementation((tagName: string, options?: ElementCreationOptions) => {
            if (tagName === 'a') return linkMock;
            return originalCreateElement(tagName, options);
        });

        render(<Sidebar />);

        // Switch to Environments tab
        fireEvent.click(screen.getByText('Envs'));

        // Find and click Export button
        const exportBtn = screen.getByTitle('Export Environments');
        fireEvent.click(exportBtn);

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(linkMock.click).toHaveBeenCalled();
        expect(linkMock.download).toContain('environments_');
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
});
