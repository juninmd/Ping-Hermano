import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requestStore } from '../stores/RequestStore';
import { runInAction, configure } from 'mobx';

configure({ enforceActions: "never" });

describe('RequestStore Gap Extra Tests', () => {
    beforeEach(() => {
        runInAction(() => {
            requestStore.tabs = [];
            requestStore.addTab(); // Ensure at least one tab
            requestStore.activeTabId = requestStore.tabs[0].id;
        });
        localStorage.clear();
    });

    it('should select previous tab when closing active tab (index > 0)', () => {
        runInAction(() => {
             requestStore.addTab();
             requestStore.addTab();
             // Tabs: [0, 1, 2]
             requestStore.setActiveTab(requestStore.tabs[2].id);
        });

        const tabToClose = requestStore.tabs[2].id;
        const previousTab = requestStore.tabs[1].id;

        requestStore.closeTab(tabToClose);

        expect(requestStore.activeTabId).toBe(previousTab);
    });

    it('should select first tab when closing active tab (index == 0) and multiple exist', () => {
         runInAction(() => {
             requestStore.addTab();
             // Tabs: [0, 1]
             requestStore.setActiveTab(requestStore.tabs[0].id);
        });

        const tabToClose = requestStore.tabs[0].id;
        const remainingTab = requestStore.tabs[1].id;

        requestStore.closeTab(tabToClose);

        expect(requestStore.activeTabId).toBe(remainingTab);
    });

    it('should not close last tab', () => {
        const lastTabId = requestStore.tabs[0].id;
        requestStore.closeTab(lastTabId);
        expect(requestStore.tabs).toHaveLength(1);
        expect(requestStore.tabs[0].id).toBe(lastTabId);
    });

    it('should ignore closeTab if id not found', () => {
        requestStore.closeTab('non-existent');
        expect(requestStore.tabs).toHaveLength(1);
    });

    it('should load activeTabId from localStorage if valid', () => {
        const tab1 = 'tab1';
        const tab2 = 'tab2';
        const tabsData = [
            { id: tab1, name: 'T1' },
            { id: tab2, name: 'T2' }
        ];

        localStorage.setItem('requestTabs', JSON.stringify(tabsData));
        localStorage.setItem('activeTabId', tab2);

        requestStore.loadTabs();

        expect(requestStore.tabs).toHaveLength(2);
        expect(requestStore.activeTabId).toBe(tab2);
    });

    it('should default to first tab if activeTabId in localStorage is invalid', () => {
         const tab1 = 'tab1';
        const tabsData = [
            { id: tab1, name: 'T1' }
        ];

        localStorage.setItem('requestTabs', JSON.stringify(tabsData));
        localStorage.setItem('activeTabId', 'non-existent');

        requestStore.loadTabs();

        expect(requestStore.tabs).toHaveLength(1);
        expect(requestStore.activeTabId).toBe(tab1);
    });

    it('should deep copy apiKey when duplicating tab', () => {
        runInAction(() => {
            requestStore.auth = {
                type: 'apikey',
                apiKey: { key: 'k', value: 'v', addTo: 'header' }
            };
        });

        const originalTabId = requestStore.activeTabId;
        requestStore.duplicateTab(originalTabId);

        // New tab is active
        const newTab = requestStore.activeTab;
        expect(newTab.id).not.toBe(originalTabId);
        expect(newTab.auth.apiKey).toEqual({ key: 'k', value: 'v', addTo: 'header' });

        // Ensure deep copy
        expect(newTab.auth.apiKey).not.toBe(requestStore.tabs.find(t => t.id === originalTabId)?.auth.apiKey);
    });
});
