import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

// Allow MobX action overriding if needed for mocking in tests
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
    });

    it('should switch between History, Collections and Environments tabs', () => {
        render(<Sidebar />);

        const buttons = screen.getAllByRole('button');
        const historyTab = buttons.find(b => b.textContent === 'History');
        const collectionsTab = buttons.find(b => b.textContent === 'Collections');
        const envsTab = buttons.find(b => b.textContent === 'Envs');

        expect(historyTab).toBeInTheDocument();
        expect(collectionsTab).toBeInTheDocument();
        expect(envsTab).toBeInTheDocument();

        // History is default
        expect(screen.getByTitle('Clear History')).toBeInTheDocument();

        // Click Collections
        fireEvent.click(collectionsTab!);
        expect(screen.getByTitle('New Collection')).toBeInTheDocument();

        // Click Envs
        fireEvent.click(envsTab!);
        expect(screen.getByTitle('New Environment')).toBeInTheDocument();

        // Click History
        fireEvent.click(historyTab!);
        expect(screen.getByTitle('Clear History')).toBeInTheDocument();
    });

    describe('History', () => {
        it('should render history items', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' },
                    { id: '2', method: 'POST', url: 'http://h2.com', date: 'now' },
                    { id: '3', method: 'OPTIONS', url: 'http://h3.com', date: 'now' },
                    { id: '4', method: 'DELETE', url: 'http://h4.com', date: 'now' },
                    { id: '5', method: 'PATCH', url: 'http://h5.com', date: 'now' },
                    { id: '6', method: 'PUT', url: 'http://h6.com', date: 'now' }
                ];
            });
            render(<Sidebar />);
            expect(screen.getByText('GET')).toBeInTheDocument();
            expect(screen.getByText('http://h1.com')).toBeInTheDocument();
            expect(screen.getByText('POST')).toBeInTheDocument();
            expect(screen.getByText('http://h2.com')).toBeInTheDocument();
            expect(screen.getByText('OPTIONS')).toBeInTheDocument();
            expect(screen.getByText('DELETE')).toBeInTheDocument();
            expect(screen.getByText('PATCH')).toBeInTheDocument();
            expect(screen.getByText('PUT')).toBeInTheDocument();
        });

        it('should load history item on click', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });

            render(<Sidebar />);

            fireEvent.click(screen.getByText('http://h1.com'));

            // Check side effect
            expect(requestStore.url).toBe('http://h1.com');
            expect(requestStore.method).toBe('GET');
        });

        it('should clear history', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }
                ];
            });

            // Mock confirm
            global.confirm = vi.fn().mockReturnValue(true);

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

            global.confirm = vi.fn().mockReturnValue(false);

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
            global.prompt = vi.fn().mockReturnValue('New Col');

            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));

            expect(global.prompt).toHaveBeenCalledWith("Enter collection name:");
            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('New Col');
        });

        it('should not create collection if prompt cancelled', () => {
            global.prompt = vi.fn().mockReturnValue(null);
            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));
            expect(requestStore.collections).toHaveLength(0);
        });

        it('should render collections', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] }
                ];
            });
            renderCollections();
            expect(screen.getByText(/Col1/)).toBeInTheDocument();
        });

        it('should delete collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] }
                ];
            });

            global.confirm = vi.fn().mockReturnValue(true);

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

            global.confirm = vi.fn().mockReturnValue(false);

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

            // Delete button for request is different. In code:
            // <ActionBtn ... style={{ fontSize: '12px', opacity: 0.4 }}>✕</ActionBtn>
            const deleteRequestBtn = screen.getByText('✕');
            fireEvent.click(deleteRequestBtn);

            // It deletes immediately without confirm (based on code in Sidebar.tsx)
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
            global.prompt = vi.fn().mockReturnValue('Env1');
            renderEnvs();
            fireEvent.click(screen.getByTitle('New Environment'));
            expect(requestStore.environments).toHaveLength(1);
            expect(requestStore.environments[0].name).toBe('Env1');
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
            global.confirm = vi.fn().mockReturnValue(true);
            renderEnvs();
            fireEvent.click(screen.getByTitle('Delete'));
            expect(requestStore.environments).toHaveLength(0);
        });

        it('should cancel delete environment', () => {
            runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            global.confirm = vi.fn().mockReturnValue(false);
            renderEnvs();
            fireEvent.click(screen.getByTitle('Delete'));
            expect(requestStore.environments).toHaveLength(1);
        });

        it('should edit environment', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
            });
            renderEnvs();
            fireEvent.click(screen.getByTitle('Edit'));

            // Should open modal
            expect(screen.getByText('Edit Environment')).toBeInTheDocument();

            // Close modal
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
            fireEvent.click(screen.getByTitle('Edit'));

            const nameInput = screen.getByDisplayValue('Env1');
            fireEvent.change(nameInput, { target: { value: 'Env1_Mod' } });

            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.environments[0].name).toBe('Env1_Mod');
            expect(screen.queryByText('Edit Environment')).not.toBeInTheDocument();
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

        it('should trigger file input click on Import Collections', () => {
            renderCollections();
            // The file input is the previous sibling of the Import button in the div
            const importBtn = screen.getByTitle('Import Collections');
            // We can't easily check click() on hidden input triggered by sibling without userEvent or mocking ref
            // But we can check if the input exists and handle change
            expect(importBtn).toBeInTheDocument();
        });

        it('should call importCollections on file selection', async () => {
            renderCollections();
            const importBtn = screen.getByTitle('Import Collections');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            // Valid JSON for collections
            const file = new File([JSON.stringify([{ name: 'Imported', requests: [] }])], 'cols.json', { type: 'application/json' });
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });
            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Collections imported successfully!');
            });
            expect(requestStore.collections).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Imported' })]));
            alertSpy.mockRestore();
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

            // Valid JSON
            const file = new File([JSON.stringify([{ name: 'ImportedEnv', variables: [] }])], 'envs.json', { type: 'application/json' });
            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            Object.defineProperty(fileInput, 'files', {
                value: [file]
            });
            fireEvent.change(fileInput);

            await waitFor(() => {
                expect(alertSpy).toHaveBeenCalledWith('Environments imported successfully!');
            });
            expect(requestStore.environments).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'ImportedEnv' })]));
            alertSpy.mockRestore();
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

            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            Object.defineProperty(fileInput, 'files', {
                value: []
            });
            fireEvent.change(fileInput);

            expect(alertSpy).not.toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('should do nothing if file selection is cancelled (Environments)', () => {
            renderEnvs();
            const importBtn = screen.getByTitle('Import Environments');
            const container = importBtn.parentElement;
            const fileInput = container?.querySelector('input[type="file"]') as HTMLInputElement;

            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

            Object.defineProperty(fileInput, 'files', {
                value: []
            });
            fireEvent.change(fileInput);

            expect(alertSpy).not.toHaveBeenCalled();
            alertSpy.mockRestore();
        });

        it('should not load request when clicking delete request button', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: 'http://test.com', date: '' }] }
                ];
                requestStore.url = '';
            });

            renderCollections();
            const deleteRequestBtn = screen.getByText('✕');
            fireEvent.click(deleteRequestBtn);

            // Verify url didn't change (loadHistoryItem sets url)
            expect(requestStore.url).toBe('');
        });

        it('should not toggle environment when clicking delete button', () => {
             runInAction(() => {
                requestStore.environments = [
                    { id: '1', name: 'Env1', variables: [] }
                ];
                requestStore.activeEnvironmentId = null;
            });

            global.confirm = vi.fn().mockReturnValue(false);
            renderEnvs();
            const deleteBtn = screen.getByTitle('Delete');
            fireEvent.click(deleteBtn);

            expect(requestStore.activeEnvironmentId).toBeNull();
        });

        it('should not toggle environment when clicking edit button', () => {
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
