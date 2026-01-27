import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';

const TabsContainer = styled.div`
  display: flex;
  background-color: #252526;
  height: 35px;
  overflow-x: auto;
  border-bottom: 1px solid #3e3e42;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #424242;
  }
`;

const TabItem = styled.div<{ $active: boolean; $method: string }>`
  display: flex;
  align-items: center;
  padding: 0 10px;
  min-width: 100px;
  max-width: 200px;
  height: 100%;
  background-color: ${props => props.$active ? '#1e1e1e' : '#2d2d2d'};
  border-right: 1px solid #252526;
  cursor: pointer;
  user-select: none;
  border-top: ${props => props.$active ? '1px solid #0078d4' : '1px solid transparent'};
  color: ${props => props.$active ? '#ffffff' : '#969696'};

  &:hover {
    background-color: ${props => props.$active ? '#1e1e1e' : '#2d2d2d'};
    color: #ffffff;
  }

  /* Method color indicator */
  &::before {
    content: '${props => props.$method}';
    font-size: 10px;
    font-weight: bold;
    margin-right: 8px;
    color: ${props => {
        switch(props.$method) {
            case 'GET': return '#61affe';
            case 'POST': return '#49cc90';
            case 'PUT': return '#fca130';
            case 'DELETE': return '#f93e3e';
            default: return '#969696';
        }
    }};
  }
`;

const TabLabel = styled.span`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
`;

const CloseButton = styled.div`
  margin-left: 8px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.7;

  &:hover {
    background-color: #4b4b4b;
    opacity: 1;
  }
`;

const DuplicateButton = styled.div`
  margin-left: 5px;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  opacity: 0.7;

  &:hover {
    background-color: #4b4b4b;
    opacity: 1;
  }
`;

const AddButton = styled.div`
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #969696;
  font-size: 20px;

  &:hover {
    color: #ffffff;
    background-color: #3e3e42;
  }
`;

export const TabList = observer(() => {
  const { tabs, activeTabId, setActiveTab, closeTab, addTab, duplicateTab } = requestStore;

  return (
    <TabsContainer>
      {tabs.map(tab => (
        <TabItem
            key={tab.id}
            $active={tab.id === activeTabId}
            $method={tab.method}
            onClick={() => setActiveTab(tab.id)}
            title={tab.url || 'New Request'}
        >
          <TabLabel>{tab.name === 'New Request' && tab.url ? tab.url.split('?')[0].split('/').pop() || tab.url : tab.name}</TabLabel>
          <DuplicateButton onClick={(e) => {
              e.stopPropagation();
              duplicateTab(tab.id);
          }} title="Duplicate Tab">
            ❐
          </DuplicateButton>
          <CloseButton onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
          }}>
            ×
          </CloseButton>
        </TabItem>
      ))}
      <AddButton onClick={addTab}>
        +
      </AddButton>
    </TabsContainer>
  );
});

export default TabList;
