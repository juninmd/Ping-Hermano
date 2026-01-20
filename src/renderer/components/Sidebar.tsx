import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';

const SidebarContainer = styled.div`
  width: 250px;
  min-width: 200px;
  background-color: #252526;
  border-right: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 0;
  border-bottom: 1px solid #3e3e42;
  display: flex;
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  background-color: ${props => props.$active ? '#252526' : '#2d2d2d'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#0078d4' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#858585'};
  padding: 10px;
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: #252526;
    color: #fff;
  }
`;

const HeaderActions = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 14px;
    text-transform: uppercase;
    color: #858585;
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
    background-color: #2a2d2e;
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
      case 'get': return '#6a9955';
      case 'post': return '#cca700';
      case 'put': return '#0078d4';
      case 'delete': return '#f48771';
      case 'patch': return '#b4009e';
      default: return '#cccccc';
    }
  }};
`;

const TextTruncate = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #cccccc;
  flex: 1;
`;

const EmptyState = styled.div`
  padding: 20px;
  text-align: center;
  color: #858585;
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
  background-color: #2d2d2d;
  color: #e0e0e0;

  &:hover {
    background-color: #383838;
  }
`;

const RequestInCollection = styled(ItemContainer)`
  padding-left: 25px;
  border-left: 3px solid transparent;

  &:hover {
    border-left-color: #0078d4;
  }
`;

const Sidebar = observer(() => {
  const {
    history,
    loadHistoryItem,
    clearHistory,
    collections,
    createCollection,
    deleteCollection,
    deleteRequestFromCollection
  } = requestStore;

  const [activeTab, setActiveTab] = useState<'history' | 'collections'>('history');

  const handleCreateCollection = () => {
    const name = prompt("Enter collection name:");
    if (name) {
      createCollection(name);
    }
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
      </SidebarHeader>

      {activeTab === 'history' && (
        <>
          <HeaderActions>
            <h3>Recent</h3>
            <ActionBtn onClick={() => clearHistory()} title="Clear History">🗑️</ActionBtn>
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
            <ActionBtn onClick={handleCreateCollection} title="New Collection">➕</ActionBtn>
          </HeaderActions>
          <ListContainer>
             {collections.length === 0 ? (
               <EmptyState>No collections. Create one!</EmptyState>
             ) : (
               collections.map(col => (
                 <CollectionItem key={col.id}>
                   <CollectionHeader>
                      <span>{col.name} ({col.requests.length})</span>
                      <ActionBtn onClick={(e) => {
                        e.stopPropagation();
                        if(confirm(`Delete collection ${col.name}?`)) deleteCollection(col.id);
                      }}>🗑️</ActionBtn>
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
                           deleteRequestFromCollection(col.id, req.id);
                         }} style={{ fontSize: '12px', opacity: 0.4 }}>✕</ActionBtn>
                      </RequestInCollection>
                   ))}
                 </CollectionItem>
               ))
             )}
          </ListContainer>
        </>
      )}
    </SidebarContainer>
  );
});

export default Sidebar;
