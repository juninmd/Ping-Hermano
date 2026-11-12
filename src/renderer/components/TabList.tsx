import React from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';

const TabsContainer = styled.div`
  display: flex;
  background-color: var(--surface);
  height: 35px;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  flex-shrink: 0;

  &::-webkit-scrollbar {
    height: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--line2);
  }
`;

const TabItem = styled.div<{ $active: boolean; $method: string }>`
  display: flex;
  align-items: center;
  padding: 0 10px;
  min-width: 100px;
  max-width: 200px;
  height: 100%;
  background-color: ${props => props.$active ? 'var(--surface3)' : 'transparent'};
  border-right: 1px solid var(--surface);
  cursor: pointer;
  user-select: none;
  animation: pop .3s cubic-bezier(.3,1.5,.5,1) both;
  transition: background-color .2s, color .2s, box-shadow .2s;
  border-top: ${props => props.$active ? '1px solid var(--accent)' : '1px solid transparent'};
  color: ${props => props.$active ? 'var(--fg-strong)' : 'var(--mute)'};

  &:hover {
    background-color: ${props => props.$active ? 'var(--surface3)' : 'transparent'};
    color: var(--fg-strong);
  }

  /* Method color indicator */
  &::before {
    content: '${props => props.$method}';
    font-size: 10px;
    font-weight: bold;
    margin-right: 8px;
    color: ${props => {
        switch(props.$method) {
            case 'GET': return 'var(--get)';
            case 'POST': return 'var(--post)';
            case 'PUT': return 'var(--put)';
            case 'DELETE': return 'var(--delete)';
            default: return 'var(--mute)';
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
    background-color: var(--line2);
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
    background-color: var(--line2);
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
  color: var(--mute);
  font-size: 20px;

  &:hover {
    color: var(--fg-strong);
    background-color: var(--line);
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
