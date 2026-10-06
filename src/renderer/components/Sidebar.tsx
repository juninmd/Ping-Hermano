import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore, Environment } from '../stores/RequestStore';
import { EnvironmentModal } from './EnvironmentModal';

const SidebarContainer = styled.div`
  width: 250px;
  min-width: 200px;
  background-color: #14171c;
  border-right: 1px solid #262b34;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 0;
  border-bottom: 1px solid #262b34;
  display: flex;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  background-color: ${props => props.$active ? '#14171c' : '#1a1e25'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#6366f1' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#7d8594'};
  padding: 10px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #14171c;
    color: #fff;
  }
`;

const HeaderActions = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #262b34;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    color: #7d8594;
  }
`;

const ActionBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  color: inherit;

  &:hover {
    opacity: 1;
  }
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ItemContainer = styled.div`
  padding: 8px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid transparent;
  font-size: 13px;

  &:hover {
    background-color: #20252e;
  }

  &.active {
    background-color: #20252e;
    border-left: 3px solid #6366f1;
    padding-left: 12px;
  }
`;

const MethodBadge = styled.span<{ method: string }>`
  font-size: 10px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 3px;
  min-width: 35px;
  text-align: center;
  color: ${props => {
    switch (props.method.toLowerCase()) {
      case 'get': return '#4ade80';
      case 'post': return '#fbbf24';
      case 'put': return '#6366f1';
      case 'delete': return '#f87171';
      case 'patch': return '#c084fc';
      default: return '#d4d8e1';
    }
  }};
`;

const TextTruncate = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #d4d8e1;
  flex: 1;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #7d8594;
  font-style: italic;
`;

const CollectionItem = styled.div`
  padding: 5px 0;
`;

const CollectionHeader = styled.div`
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 13px;
  background-color: #1a1e25;
  color: #e5e7ee;

  &:hover {
    background-color: #232832;
  }
`;

const RequestInCollection = styled(ItemContainer)`
  padding-left: 25px;
  border-left: 3px solid transparent;

  &:hover {
    border-left-color: #6366f1;
  }
`;

export const Sidebar = observer(() => {
  const {
    history,
    loadHistoryItem,
    clearHistory,
    collections,
    createCollection,
    deleteCollection,
    deleteRequestFromCollection,
    renameCollection,
    renameRequestInCollection,
    environments,
    createEnvironment,
    deleteEnvironment,
    updateEnvironment,
    activeEnvironmentId,
    setActiveEnvironment,
    importCollections,
    exportCollections,
    importEnvironments,
    exportEnvironments
  } = requestStore;

  const [activeTab, setActiveTab] = useState<'history' | 'collections' | 'environments'>('history');
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  const collectionFileInput = useRef<HTMLInputElement>(null);
  const envFileInput = useRef<HTMLInputElement>(null);

  const handleCreateCollection = () => {
    const name = prompt("Enter collection name:");
    if (name) {
      createCollection(name);
    }
  };

  const handleCreateEnvironment = () => {
      const name = prompt("Enter environment name:");
      if (name) {
          createEnvironment(name);
      }
  }

  const handleImportCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = importCollections(ev.target.result as string);
              if (success) alert('Collections imported successfully!');
              else alert('Failed to import collections. Invalid format?');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportCollections = () => {
      const data = exportCollections();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImportEnvironment = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = importEnvironments(ev.target.result as string);
               if (success) alert('Environments imported successfully!');
               else alert('Failed to import environments. Invalid format?');
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportEnvironments = () => {
      const data = exportEnvironments();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `environments_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  return (
    <SidebarContainer>
      <SidebarHeader>
        <TabButton
          $active={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
        >
          History
        </TabButton>
        <TabButton
          $active={activeTab === 'collections'}
          onClick={() => setActiveTab('collections')}
        >
          Collections
        </TabButton>
        <TabButton
            $active={activeTab === 'environments'}
            onClick={() => setActiveTab('environments')}
        >
            Envs
        </TabButton>
      </SidebarHeader>

      {activeTab === 'history' && (
        <>
          <HeaderActions>
            <h3>Recent</h3>
            <ActionBtn onClick={() => {
              if (confirm('Clear all history?')) clearHistory();
            }} title="Clear History">🗑️</ActionBtn>
          </HeaderActions>
          <ListContainer>
            {history.length === 0 ? (
              <EmptyState>No history yet</EmptyState>
            ) : (
              history.map((item) => (
                <ItemContainer
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                >
                  <MethodBadge method={item.method}>{item.method}</MethodBadge>
                  <TextTruncate title={item.url}>{item.url}</TextTruncate>
                </ItemContainer>
              ))
            )}
          </ListContainer>
        </>
      )}

      {activeTab === 'collections' && (
        <>
           <HeaderActions>
            <h3>Saved</h3>
            <div style={{ display: 'flex', gap: 5 }}>
                <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    ref={collectionFileInput}
                    onChange={handleImportCollection}
                />
                <ActionBtn onClick={() => collectionFileInput.current?.click()} title="Import Collections">📥</ActionBtn>
                <ActionBtn onClick={handleExportCollections} title="Export Collections">📤</ActionBtn>
                <ActionBtn onClick={handleCreateCollection} title="New Collection">➕</ActionBtn>
            </div>
          </HeaderActions>
          <ListContainer>
             {collections.length === 0 ? (
               <EmptyState>No collections. Create one!</EmptyState>
             ) : (
               collections.map(col => (
                 <CollectionItem key={col.id}>
                   <CollectionHeader>
                      <span>{col.name} ({col.requests.length})</span>
                      <div>
                        <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt("Rename collection:", col.name);
                            if(newName) renameCollection(col.id, newName);
                        }} title="Rename Collection">✏️</ActionBtn>
                        <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            if(confirm(`Delete collection ${col.name}?`)) deleteCollection(col.id);
                        }} title="Delete Collection">🗑️</ActionBtn>
                      </div>
                   </CollectionHeader>
                   {col.requests.map(req => (
                      <RequestInCollection
                        key={req.id}
                        onClick={() => loadHistoryItem(req)}
                      >
                         <MethodBadge method={req.method}>{req.method}</MethodBadge>
                         <TextTruncate title={req.name || req.url}>{req.name || req.url}</TextTruncate>
                         <ActionBtn onClick={(e) => {
                            e.stopPropagation();
                            const newName = prompt("Rename request:", req.name || 'New Request');
                            if(newName) renameRequestInCollection(col.id, req.id, newName);
                         }} style={{ fontSize: '12px', opacity: 0.4, marginRight: 5 }} title="Rename Request">✏️</ActionBtn>
                         <ActionBtn onClick={(e) => {
                           e.stopPropagation();
                           deleteRequestFromCollection(col.id, req.id);
                         }} style={{ fontSize: '12px', opacity: 0.4 }} title="Delete Request">✕</ActionBtn>
                      </RequestInCollection>
                   ))}
                 </CollectionItem>
               ))
             )}
          </ListContainer>
        </>
      )}

      {activeTab === 'environments' && (
          <>
            <HeaderActions>
                <h3>Environments</h3>
                <div style={{ display: 'flex', gap: 5 }}>
                    <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        ref={envFileInput}
                        onChange={handleImportEnvironment}
                    />
                    <ActionBtn onClick={() => envFileInput.current?.click()} title="Import Environments">📥</ActionBtn>
                    <ActionBtn onClick={handleExportEnvironments} title="Export Environments">📤</ActionBtn>
                    <ActionBtn onClick={handleCreateEnvironment} title="New Environment">➕</ActionBtn>
                </div>
            </HeaderActions>
            <ListContainer>
                {environments.length === 0 ? (
                    <EmptyState>No environments created.</EmptyState>
                ) : (
                    environments.map(env => (
                        <ItemContainer
                            key={env.id}
                            className={activeEnvironmentId === env.id ? 'active' : ''}
                            onClick={() => setActiveEnvironment(env.id === activeEnvironmentId ? null : env.id)}
                        >
                            <span style={{ flex: 1 }}>{env.name}</span>
                            <ActionBtn onClick={(e) => {
                                e.stopPropagation();
                                setEditingEnv(env);
                            }} title="Edit">✏️</ActionBtn>
                            <ActionBtn onClick={(e) => {
                                e.stopPropagation();
                                if(confirm(`Delete environment ${env.name}?`)) deleteEnvironment(env.id);
                            }} title="Delete">🗑️</ActionBtn>
                        </ItemContainer>
                    ))
                )}
            </ListContainer>
          </>
      )}

      {editingEnv && (
          <EnvironmentModal
            environment={editingEnv}
            onClose={() => setEditingEnv(null)}
            onSave={(id, name, vars) => {
                updateEnvironment(id, name, vars);
                setEditingEnv(null);
            }}
          />
      )}
    </SidebarContainer>
  );
});

export default Sidebar;
