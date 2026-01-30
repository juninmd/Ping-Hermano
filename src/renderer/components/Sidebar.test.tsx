import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('Sidebar', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.history = [];
            requestStore.collections = [];
            requestStore.environments = [];
            requestStore.activeEnvironmentId = null;
            requestStore.method = 'GET';
            requestStore.url = '';
        });
        vi.restoreAllMocks();

        // Mock prompt, confirm, alert
        global.prompt = vi.fn();
        global.confirm = vi.fn();
        global.alert = vi.fn();
    });

    it('should switch between History, Collections and Environments tabs', () => {
        render(<Sidebar />);
        const buttons = screen.getAllByRole('button');
        const historyTab = buttons.find(b => b.textContent === 'History');
        const collectionsTab = buttons.find(b => b.textContent === 'Collections');
        const envsTab = buttons.find(b => b.textContent === 'Envs');

        fireEvent.click(collectionsTab!);
        expect(screen.getByTitle('New Collection')).toBeInTheDocument();

        fireEvent.click(envsTab!);
        expect(screen.getByTitle('New Environment')).toBeInTheDocument();

        fireEvent.click(historyTab!);
        expect(screen.getByTitle('Clear History')).toBeInTheDocument();
    });

    describe('History', () => {
        it('should render history items', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });
            render(<Sidebar />);
            expect(screen.getByText('GET')).toBeInTheDocument();
            expect(screen.getByText('http://h1.com')).toBeInTheDocument();
        });

        it('should load history item on click', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });
            render(<Sidebar />);
            fireEvent.click(screen.getByText('http://h1.com'));
            expect(requestStore.url).toBe('http://h1.com');
        });

        it('should clear history', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });
            (global.confirm as any).mockReturnValue(true);

            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));

            expect(global.confirm).toHaveBeenCalledWith('Clear all history?');
            expect(requestStore.history).toHaveLength(0);
        });

        it('should cancel clear history', () => {
             runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });
            (global.confirm as any).mockReturnValue(false);

            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));

            expect(requestStore.history).toHaveLength(1);
        });
    });

    describe('Collections', () => {
        const renderCollections = () => {
            const utils = render(<Sidebar />);
            const buttons = screen.getAllByRole('button');
            const collectionsTab = buttons.find(b => b.textContent === 'Collections');
            fireEvent.click(collectionsTab!);
            return utils;
        }

        it('should create new collection', () => {
            (global.prompt as any).mockReturnValue('New Col');
            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));
            expect(global.prompt).toHaveBeenCalledWith("Enter collection name:");
            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('New Col');
        });

        it('should not create collection if prompt cancelled', () => {
            (global.prompt as any).mockReturnValue(null);
            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));
            expect(requestStore.collections).toHaveLength(0);
        });

        it('should delete collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] }
                ];
            });
            (global.confirm as any).mockReturnValue(true);

            renderCollections();
            const deleteButtons = screen.getAllByText('🗑️');
            fireEvent.click(deleteButtons[0]);

            expect(global.confirm).toHaveBeenCalledWith('Delete collection Col1?');
            expect(requestStore.collections).toHaveLength(0);
        });

        it('should cancel delete collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] }
                ];
            });
            (global.confirm as any).mockReturnValue(false);

            renderCollections();
            const deleteButtons = screen.getAllByText('🗑️');
            fireEvent.click(deleteButtons[0]);

            expect(requestStore.collections).toHaveLength(1);
        });

        it('should delete request from collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: '', date: '' }] }
                ];
            });
            renderCollections();
            const deleteRequestBtn = screen.getByText('✕');
            fireEvent.click(deleteRequestBtn);
            expect(requestStore.collections[0].requests).toHaveLength(0);
        });

        it('should load request from collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: 'http://test.com', date: '' }] }
                ];
            });
            renderCollections();
            fireEvent.click(screen.getByText('Req1'));
            expect(requestStore.url).toBe('http://test.com');
        });

        it('should rename collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Old Name', requests: [] }
                ];
            });
            (global.prompt as any).mockReturnValue('New Name');
            renderCollections();
            const renameBtn = screen.getByTitle('Rename Collection');
            fireEvent.click(renameBtn);

            expect(global.prompt).toHaveBeenCalledWith("Rename collection:", "Old Name");
            expect(requestStore.collections[0].name).toBe('New Name');
        });

        it('should not rename collection if prompt cancelled', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Old Name', requests: [] }
                ];
            });
            (global.prompt as any).mockReturnValue(null);
            renderCollections();
            const renameBtn = screen.getByTitle('Rename Collection');
            fireEvent.click(renameBtn);

            expect(requestStore.collections[0].name).toBe('Old Name');
        });

        it('should rename request in collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Old Req', method: 'GET', url: '', date: '' }] }
                ];
            });
            (global.prompt as any).mockReturnValue('New Req');
            renderCollections();
            const renameBtn = screen.getByTitle('Rename Request');
            fireEvent.click(renameBtn);

            expect(global.prompt).toHaveBeenCalledWith("Rename request:", "Old Req");
            expect(requestStore.collections[0].requests[0].name).toBe('New Req');
        });

         it('should not rename request in collection if prompt cancelled', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Old Req', method: 'GET', url: '', date: '' }] }
                ];
            });
            (global.prompt as any).mockReturnValue(null);
            renderCollections();
            const renameBtn = screen.getByTitle('Rename Request');
            fireEvent.click(renameBtn);

            expect(requestStore.collections[0].requests[0].name).toBe('Old Req');
        });
    });

    describe('Environments', () => {
        const renderEnvs = () => {
            const utils = render(<Sidebar />);
            const buttons = screen.getAllByRole('button');
            const envsTab = buttons.find(b => b.textContent === 'Envs');
            fireEvent.click(envsTab!);
            return utils;
        }

        it('should create environment', () => {
            (global.prompt as any).mockReturnValue('Env1');
            renderEnvs();
            fireEvent.click(screen.getByTitle('New Environment'));
            expect(requestStore.environments).toHaveLength(1);
            expect(requestStore.environments[0].name).toBe('Env1');
        });

        it('should not create environment if prompt cancelled', () => {
            (global.prompt as any).mockReturnValue(null);
            renderEnvs();
            fireEvent.click(screen.getByTitle('New Environment'));
            expect(requestStore.environments).toHaveLength(0);
        });

        it('should activate environment', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            renderEnvs();
            fireEvent.click(screen.getByText('Env1'));
            expect(requestStore.activeEnvironmentId).toBe('1');

            // Toggle off
            fireEvent.click(screen.getByText('Env1'));
            expect(requestStore.activeEnvironmentId).toBeNull();
        });

        it('should delete environment', () => {
            runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            (global.confirm as any).mockReturnValue(true);
            renderEnvs();
            const deleteBtn = screen.getByTitle('Delete');
            fireEvent.click(deleteBtn);
            expect(requestStore.environments).toHaveLength(0);
        });

        it('should cancel delete environment', () => {
            runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            (global.confirm as any).mockReturnValue(false);
            renderEnvs();
            const deleteBtn = screen.getByTitle('Delete');
            fireEvent.click(deleteBtn);
            expect(requestStore.environments).toHaveLength(1);
        });

        it('should edit environment', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            renderEnvs();
            const editBtn = screen.getByTitle('Edit');
            fireEvent.click(editBtn);

            expect(screen.getByText('Edit Environment')).toBeInTheDocument();
            fireEvent.click(screen.getByText('Cancel'));
            expect(screen.queryByText('Edit Environment')).not.toBeInTheDocument();
        });

         it('should save environment edits', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            renderEnvs();
            const editBtn = screen.getByTitle('Edit');
            fireEvent.click(editBtn);

            const nameInput = screen.getByDisplayValue('Env1');
            fireEvent.change(nameInput, { target: { value: 'Env1_Mod' } });
            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.environments[0].name).toBe('Env1_Mod');
        });
    });

    describe('Import/Export UI', () => {
        const renderCollections = () => {
            const utils = render(<Sidebar />);
            const buttons = screen.getAllByRole('button');
            const collectionsTab = buttons.find(b => b.textContent === 'Collections');
            fireEvent.click(collectionsTab!);
            return utils;
        }

        const renderEnvs = () => {
            const utils = render(<Sidebar />);
            const buttons = screen.getAllByRole('button');
            const envsTab = buttons.find(b => b.textContent === 'Envs');
            fireEvent.click(envsTab!);
            return utils;
        }

        it('should call importCollections on file selection', async () => {
            renderCollections();
            const importBtn = screen.getByTitle('Import Collections');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            const file = new File([JSON.stringify([{ name: 'Imported', requests: [] }])], 'cols.json', { type: 'application/json' });

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });
            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Collections imported successfully!');
            });
            expect(requestStore.collections).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Imported' })]));
        });

        it('should trigger download on Export Collections', () => {
            renderCollections();
            global.URL.createObjectURL = vi.fn(() => 'blob:url');
            global.URL.revokeObjectURL = vi.fn();
            const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

            fireEvent.click(screen.getByTitle('Export Collections'));

            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
        });

         it('should call importEnvironments on file selection', async () => {
            renderEnvs();
            const importBtn = screen.getByTitle('Import Environments');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            const file = new File([JSON.stringify([{ name: 'ImportedEnv', variables: [] }])], 'envs.json', { type: 'application/json' });

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });
            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Environments imported successfully!');
            });
            expect(requestStore.environments).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'ImportedEnv' })]));
        });

        it('should trigger download on Export Environments', () => {
            renderEnvs();
            global.URL.createObjectURL = vi.fn(() => 'blob:url');
            global.URL.revokeObjectURL = vi.fn();
            const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

            fireEvent.click(screen.getByTitle('Export Environments'));
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
        });

        it('should do nothing if file selection is cancelled (Collections)', () => {
            renderCollections();
            const importBtn = screen.getByTitle('Import Collections');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            Object.defineProperty(fileInput, 'files', {
                value: []
            });
            fireEvent.change(fileInput);
            expect(global.alert).not.toHaveBeenCalled();
        });

        it('should alert if import collections fails', async () => {
            renderCollections();
            const importBtn = screen.getByTitle('Import Collections');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            const file = new File(['invalid'], 'cols.json', { type: 'application/json' });

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });
            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(global.alert).toHaveBeenCalledWith('Failed to import collections. Invalid format?');
            });
        });

        it('should handle null result on import (collections)', async () => {
            renderCollections();
            const importBtn = screen.getByTitle('Import Collections');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            const originalFileReader = global.FileReader;
            global.FileReader = class {
                readAsText() {
                    if (this.onload) {
                        this.onload({ target: { result: null } } as any);
                    }
                }
                onload: any = null;
            } as any;

            fireEvent.change(fileInput, { target: { files: [new File([], 'test')] } });

            expect(global.alert).not.toHaveBeenCalled();
            global.FileReader = originalFileReader;
        });

        it('should do nothing if file selection is cancelled (Environments)', () => {
            renderEnvs();
            const importBtn = screen.getByTitle('Import Environments');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            Object.defineProperty(fileInput, 'files', {
                value: []
            });
            fireEvent.change(fileInput);
            expect(global.alert).not.toHaveBeenCalled();
        });

        it('should alert if import environments fails', async () => {
             renderEnvs();
             const importBtn = screen.getByTitle('Import Environments');
             const container = importBtn.parentElement;
             const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

             const file = new File(['invalid'], 'envs.json', { type: 'application/json' });

             Object.defineProperty(fileInput, 'files', {
                 value: [file]
             });
             fireEvent.change(fileInput);

             await waitFor(() => {
                 expect(global.alert).toHaveBeenCalledWith('Failed to import environments. Invalid format?');
             });
        });

        it('should not load request when clicking delete request button (stopPropagation)', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: 'http://test.com', date: '' }] }
                ];
                requestStore.url = '';
            });

            renderCollections();
            const deleteRequestBtn = screen.getByText('✕');
            fireEvent.click(deleteRequestBtn);
            // Verify url didn't change (because loadHistoryItem wasn't called)
            expect(requestStore.url).toBe('');
        });

        it('should not toggle environment when clicking delete button (stopPropagation)', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
                requestStore.activeEnvironmentId = null;
            });
            (global.confirm as any).mockReturnValue(false);

            renderEnvs();
            const deleteBtn = screen.getByTitle('Delete');
            fireEvent.click(deleteBtn);
            expect(requestStore.activeEnvironmentId).toBeNull();
        });

        it('should not toggle environment when clicking edit button (stopPropagation)', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
                requestStore.activeEnvironmentId = null;
            });

            renderEnvs();
            const editBtn = screen.getByTitle('Edit');
            fireEvent.click(editBtn);
            expect(requestStore.activeEnvironmentId).toBeNull();
        });
    });
});
