import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';

describe('Sidebar Gap Tests', () => {
    it('should click hidden file input when "Import Collections" button is clicked', () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Collections'));

        const fileInput = screen.getByTitle('Import Collections').parentElement!.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, 'click');

        const importBtn = screen.getByTitle('Import Collections');
        fireEvent.click(importBtn);

        expect(clickSpy).toHaveBeenCalled();
    });

    it('should click hidden file input when "Import Environments" button is clicked', () => {
        render(<Sidebar />);
        fireEvent.click(screen.getByText('Envs'));

        const fileInput = screen.getByTitle('Import Environments').parentElement!.querySelector('input[type="file"]') as HTMLInputElement;
        const clickSpy = vi.spyOn(fileInput, 'click');

        const importBtn = screen.getByTitle('Import Environments');
        fireEvent.click(importBtn);

        expect(clickSpy).toHaveBeenCalled();
    });
});
