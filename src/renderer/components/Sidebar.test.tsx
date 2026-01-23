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
    });

    it('should switch between tabs', () => {
        render(<Sidebar />);

        fireEvent.click(screen.getByText('Collections'));
        expect(screen.getByTitle('New Collection')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Envs'));
        expect(screen.getByTitle('New Environment')).toBeInTheDocument();

        fireEvent.click(screen.getByText('History'));
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
            expect(screen.getByText('http://h1.com')).toBeInTheDocument();
        });

        it('should load history item', () => {
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
                requestStore.history = [{ id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }];
            });
            global.confirm = vi.fn().mockReturnValue(true);
            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));
            expect(requestStore.history).toHaveLength(0);
        });

        it('should not clear history if cancelled', () => {
            runInAction(() => {
                requestStore.history = [{ id: '1', method: 'GET', url: 'http://h1.com', date: 'now' }];
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
            fireEvent.click(screen.getByText('Collections'));
            return utils;
        }

        it('should create new collection', () => {
            global.prompt = vi.fn().mockReturnValue('New Col');
            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));
            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('New Col');
        });

        it('should not create collection if prompt cancelled', () => {
            global.prompt = vi.fn().mockReturnValue(null);
            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));
            expect(requestStore.collections).toHaveLength(0);
        });

        it('should delete collection', () => {
            runInAction(() => {
                requestStore.collections = [{ id: '1', name: 'Col1', requests: [] }];
            });
            global.confirm = vi.fn().mockReturnValue(true);
            renderCollections();

            // The emoji is 🗑️ inside ActionBtn.
            const trashBtn = screen.getByText('🗑️');
            fireEvent.click(trashBtn);
            expect(requestStore.collections).toHaveLength(0);
        });

        it('should delete request from collection', () => {
            runInAction(() => {
                requestStore.collections = [{
                    id: '1',
                    name: 'Col1',
                    requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: 'http://test.com', date: '' }]
                }];
            });
            renderCollections();
            const deleteRequestBtn = screen.getByText('✕');
            fireEvent.click(deleteRequestBtn); // It stops propagation
            expect(requestStore.collections[0].requests).toHaveLength(0);
        });

        it('should load request from collection', () => {
             runInAction(() => {
                requestStore.collections = [{
                    id: '1',
                    name: 'Col1',
                    requests: [{ id: 'r1', name: 'Req1', method: 'POST', url: 'http://loaded.com', date: '' }]
                }];
            });
            renderCollections();
            fireEvent.click(screen.getByText('Req1'));
            expect(requestStore.url).toBe('http://loaded.com');
            expect(requestStore.method).toBe('POST');
        });
    });

    describe('Environments', () => {
        const renderEnvs = () => {
            const utils = render(<Sidebar />);
            fireEvent.click(screen.getByText('Envs'));
            return utils;
        }

        it('should create environment', () => {
            global.prompt = vi.fn().mockReturnValue('Dev Env');
            renderEnvs();
            fireEvent.click(screen.getByTitle('New Environment'));
            expect(requestStore.environments).toHaveLength(1);
            expect(requestStore.environments[0].name).toBe('Dev Env');
        });

         it('should not create environment if prompt cancelled', () => {
            global.prompt = vi.fn().mockReturnValue(null);
            renderEnvs();
            fireEvent.click(screen.getByTitle('New Environment'));
            expect(requestStore.environments).toHaveLength(0);
        });

        it('should delete environment', () => {
            runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Test Env', variables: [] }];
            });
            global.confirm = vi.fn().mockReturnValue(true);
            renderEnvs();

            const trashBtn = screen.getByTitle('Delete');
            fireEvent.click(trashBtn);

            expect(requestStore.environments).toHaveLength(0);
        });

        it('should activate environment', async () => {
            runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Test Env', variables: [] }];
            });
            renderEnvs();

            let envItem = screen.getByText('Test Env').closest('div'); // The ItemContainer
            fireEvent.click(envItem!);

            expect(requestStore.activeEnvironmentId).toBe('1');

            // Wait for UI to update (class 'active' added)
            await waitFor(() => {
                const item = screen.getByText('Test Env').closest('div');
                expect(item).toHaveClass('active');
            });

            // Re-query to be safe (though usually same element)
            envItem = screen.getByText('Test Env').closest('div');

            // Toggle off
            fireEvent.click(envItem!);
            expect(requestStore.activeEnvironmentId).toBe(null);
        });

        it('should open edit modal', () => {
            runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Test Env', variables: [] }];
            });
            renderEnvs();

            fireEvent.click(screen.getByTitle('Edit'));

            expect(screen.getByText('Edit Environment')).toBeInTheDocument();
        });

        it('should save environment from modal', () => {
            runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Test Env', variables: [] }];
            });
            renderEnvs();
            fireEvent.click(screen.getByTitle('Edit'));

            const nameInput = screen.getByDisplayValue('Test Env');
            fireEvent.change(nameInput, { target: { value: 'Prod Env' } });

            fireEvent.click(screen.getByText('Save'));

            expect(requestStore.environments[0].name).toBe('Prod Env');
            expect(screen.queryByText('Edit Environment')).not.toBeInTheDocument();
        });

        it('should close modal on cancel', () => {
            runInAction(() => {
                requestStore.environments = [{ id: '1', name: 'Test Env', variables: [] }];
            });
            renderEnvs();
            fireEvent.click(screen.getByTitle('Edit'));

            fireEvent.click(screen.getByText('Cancel'));

            expect(screen.queryByText('Edit Environment')).not.toBeInTheDocument();
        });
    });
});
