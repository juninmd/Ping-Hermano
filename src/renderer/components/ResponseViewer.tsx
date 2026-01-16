import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';

const ViewerContainer = styled.div<{ empty?: boolean }>`
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    ${props => props.empty && `
        align-items: center;
        justify-content: center;
    `}
`;

const PlaceholderText = styled.div`
    color: #858585;
    font-size: 16px;
`;

const Loader = styled.div`
    color: #0078d4;
`;

const ResponseMeta = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 13px;
`;

const StatusValue = styled.span<{ status: number }>`
    font-weight: bold;
    color: ${props => {
        if (props.status >= 200 && props.status < 300) return '#6a9955';
        if (props.status >= 300 && props.status < 400) return '#cca700';
        if (props.status >= 400 && props.status < 600) return '#f48771';
        return 'inherit';
    }};
`;

const MetaInfo = styled.div`
    color: #858585;
`;

const Tabs = styled.div`
  display: flex;
  gap: 20px;
  border-bottom: 1px solid #3e3e42;
  margin-top: 10px;
`;

const Tab = styled.div<{ active?: boolean }>`
  padding: 8px 0;
  cursor: pointer;
  color: ${props => props.active ? '#cccccc' : '#858585'};
  font-size: 13px;
  position: relative;
  font-weight: ${props => props.active ? '500' : 'normal'};

  &:hover {
    color: #cccccc;
  }

  ${props => props.active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: #f89d36;
    }
  `}
`;

const TabContent = styled.div`
  padding-top: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 150px;
`;

const HeadersGrid = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid #3e3e42;
    border-radius: 4px;
`;

const HeaderRow = styled.div`
    display: flex;
    border-bottom: 1px solid #3e3e42;
    &:last-child {
        border-bottom: none;
    }
`;

const ReadOnlyInput = styled.input`
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    color: #cccccc;
    border-right: 1px solid #3e3e42;
    outline: none;
    background-color: #252526;
`;

const ResponseBody = styled.textarea`
    width: 100%;
    height: 100%;
    flex: 1;
    background-color: #1e1e1e;
    color: #d4d4d4;
    border: none;
    padding: 10px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    resize: none;
    outline: none;
`;

const ResponseViewer = observer(() => {
  const { response, loading, error } = requestStore;
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  if (loading) {
    return (
        <ViewerContainer empty>
            <Loader>Loading...</Loader>
        </ViewerContainer>
    );
  }

  if (!response && !error) {
    return (
        <ViewerContainer empty>
            <PlaceholderText>Enter URL and click Send to get a response</PlaceholderText>
        </ViewerContainer>
    );
  }

  const data = response ? response.data : null;
  const status = response ? response.status : 0;
  const statusText = response ? response.statusText : '';
  const headers = response ? response.headers : {};

  const formatBody = (content: any) => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'object') {
      try {
        return JSON.stringify(content, null, 2);
      } catch {
        return content.toString();
      }
    }
    try {
        const json = JSON.parse(content);
        return JSON.stringify(json, null, 2);
    } catch {
        return content;
    }
  }

  return (
    <ViewerContainer>
      <ResponseMeta>
          <div className="status-label">Status: <StatusValue status={status}>{status} {statusText}</StatusValue></div>
          <MetaInfo>Time: --ms</MetaInfo>
          <MetaInfo>Size: --KB</MetaInfo>
      </ResponseMeta>

      <Tabs>
        <Tab active={activeTab === 'body'} onClick={() => setActiveTab('body')}>Body</Tab>
        <Tab active={activeTab === 'headers'} onClick={() => setActiveTab('headers')}>Headers</Tab>
      </Tabs>

      <TabContent>
        {activeTab === 'body' && (
             <ResponseBody
                readOnly
                value={formatBody(data)}
             />
        )}
        {activeTab === 'headers' && (
            <HeadersGrid>
                {Object.entries(headers).map(([key, value]) => (
                        <HeaderRow key={key}>
                        <ReadOnlyInput readOnly value={key} />
                        <ReadOnlyInput readOnly value={String(value)} />
                        </HeaderRow>
                ))}
            </HeadersGrid>
        )}
      </TabContent>
    </ViewerContainer>
  );
});

export default ResponseViewer;
