import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';
import { requestStore } from '../stores/RequestStore';
import '@testing-library/jest-dom';
import { runInAction, configure } from 'mobx';

// Allow MobX action overriding if needed for mocking in tests
configure({ enforceActions: "never" });

// Mock mobx-react-lite observer
vi.mock('mobx-react-lite', async () => {
    const actual = await vi.importActual('mobx-react-lite');
    return {
        ...actual,
        observer: (component: any) => component,
    };
});

// We can't easily mock methods on the singleton instance directly if they are not configurable.
// Instead, we will spy on them or mock the entire module?
// Mocking module 'requestStore' is tricky because it exports a class instance.

// Let's try to mock the store methods by assigning to them directly without Object.defineProperty,
// assuming they are writable. If not, we might need to mock the whole store module.
// But we want to test interaction with the store.

// The issue "Cannot redefine property" usually happens when property is non-configurable.
// MobX `makeAutoObservable` makes properties configurable usually, but `autoBind` might affect it.

// Alternative: We can wrap the actions in the store itself or pass them as props, but we are testing integration with global store.

// Let's rely on spying. `vi.spyOn` should work if the method is on the instance.
// If it fails with "Cannot assign to read only property", it means the method is read-only.

// Let's try to verify if we can just call them and check state changes, without spying?
// For `loadHistoryItem`, we want to verify it was called. But we can also verify the EFFECT: the store state changes.
// `loadHistoryItem` updates `method`, `url`, etc.
// `createCollection` updates `collections`.
// `deleteCollection` updates `collections`.
// `clearHistory` updates `history`.

// So we don't strictly NEED to spy if we check side effects.
// `loadHistoryItem` side effect: store.url, store.method etc are updated.

describe('Sidebar', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.history = [];
            requestStore.collections = [];
            requestStore.method = 'GET';
            requestStore.url = '';
        });
        vi.restoreAllMocks();
    });

    it('should switch between History and Collections tabs', () => {
        render(<Sidebar />);

        const buttons = screen.getAllByRole('button');
        const collectionsTab = buttons.find(b => b.textContent === 'Collections');
        const historyTab = buttons.find(b => b.textContent === 'History');

        expect(collectionsTab).toBeInTheDocument();
        expect(historyTab).toBeInTheDocument();

        // History is default
        expect(screen.getByTitle('Clear History')).toBeInTheDocument();

        // Click Collections
        fireEvent.click(collectionsTab!);
        expect(screen.getByTitle('New Collection')).toBeInTheDocument();

        // Click History
        fireEvent.click(historyTab!);
        expect(screen.getByTitle('Clear History')).toBeInTheDocument();
    });

    describe('History', () => {
        it('should render history items', () => {
            runInAction(() => {
                requestStore.history = [
                    { id: '1', method: 'GET', url: 'http://h1.com', date: 'now' },
                    { id: '2', method: 'POST', url: 'http://h2.com', date: 'now' }
                ];
            });
            render(<Sidebar />);
            expect(screen.getByText('GET')).toBeInTheDocument();
            expect(screen.getByText('http://h1.com')).toBeInTheDocument();
            expect(screen.getByText('POST')).toBeInTheDocument();
            expect(screen.getByText('http://h2.com')).toBeInTheDocument();
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
            global.confirm = () => true;

            render(<Sidebar />);
            fireEvent.click(screen.getByTitle('Clear History'));

            // Check side effect
            expect(requestStore.history).toHaveLength(0);
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
            global.prompt = () => 'New Col';

            renderCollections();
            fireEvent.click(screen.getByTitle('New Collection'));

            // Check side effect
            expect(requestStore.collections).toHaveLength(1);
            expect(requestStore.collections[0].name).toBe('New Col');
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

        it('should expand collection', () => {
            runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [{ id: 'r1', name: 'Req1', method: 'GET', url: '', date: '' }] }
                ];
            });

            renderCollections();
            // Sidebar renders all requests in collection by default
            expect(screen.getByText('Req1')).toBeInTheDocument();
        });

        it('should delete collection', () => {
             runInAction(() => {
                requestStore.collections = [
                    { id: '1', name: 'Col1', requests: [] }
                ];
            });

            global.confirm = () => true;

            renderCollections();

            const deleteButtons = screen.getAllByText('🗑️');
            fireEvent.click(deleteButtons[0]);

            // Check side effect
            expect(requestStore.collections).toHaveLength(0);
        });
    });
});
