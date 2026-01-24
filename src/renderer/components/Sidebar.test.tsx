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

        it('should not create environment if prompt cancelled', () => {
            global.prompt = vi.fn().mockReturnValue(null);
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
});
