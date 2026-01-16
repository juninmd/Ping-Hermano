import React from 'react';
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

const ClearBtn = styled.button`
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

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const HistoryItemContainer = styled.div`
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

const UrlTruncate = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #cccccc;
  flex: 1;
`;

const EmptyHistory = styled.div`
  padding: 20px;
  text-align: center;
  color: #858585;
  font-style: italic;
`;

const Sidebar = observer(() => {
  const { history, loadHistoryItem, clearHistory } = requestStore;

  return (
    <SidebarContainer>
      <SidebarHeader>
        <h3>History</h3>
        <ClearBtn onClick={() => clearHistory()} title="Clear History">🗑️</ClearBtn>
      </SidebarHeader>
      <HistoryList>
        {history.length === 0 ? (
          <EmptyHistory>No history yet</EmptyHistory>
        ) : (
          history.map((item) => (
            <HistoryItemContainer
              key={item.id}
              onClick={() => loadHistoryItem(item)}
            >
              <MethodBadge method={item.method}>{item.method}</MethodBadge>
              <UrlTruncate title={item.url}>{item.url}</UrlTruncate>
            </HistoryItemContainer>
          ))
        )}
      </HistoryList>
    </SidebarContainer>
  );
});

export default Sidebar;
