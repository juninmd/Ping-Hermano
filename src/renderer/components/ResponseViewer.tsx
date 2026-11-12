import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';
import { JsonTree } from './JsonTree';
import { Timeline } from './Timeline';

const ViewerContainer = styled.div<{ $empty?: boolean }>`
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    ${props => props.$empty && `
        align-items: center;
        justify-content: center;
    `}
`;

const PlaceholderText = styled.div`
    color: var(--mute);
    font-size: 16px;
`;

const Loader = styled.div`
    color: var(--accent);
`;

const ResponseMeta = styled.div`
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
    font-size: 13px;
`;

const Radar = styled.div`
  position: relative; width: 100px; height: 100px; margin: 0 auto 14px;
  i { position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid var(--accent2);
      opacity: 0; animation: ping 2.6s ease-out infinite; }
  i:nth-child(2) { animation-delay: .9s; } i:nth-child(3) { animation-delay: 1.8s; }
  b { position: absolute; inset: 0; margin: auto; width: 20px; height: 20px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent2)); box-shadow: 0 0 28px var(--accent); }
`;

const StatusValue = styled.span<{ status: number }>`
    font-weight: bold;
    color: ${props => {
        if (props.status >= 200 && props.status < 300) return '#4ade80';
        if (props.status >= 300 && props.status < 400) return '#fbbf24';
        if (props.status >= 400 && props.status < 600) return '#f87171';
        return 'inherit';
    }};
`;

const MetaInfo = styled.div`
    color: var(--mute);
`;

const Tabs = styled.div`
  display: flex;
  gap: 20px;
  border-bottom: 1px solid var(--line);
  margin-top: 10px;
  align-items: center;
`;

const Spacer = styled.div`
  flex: 1;
`;

const ActionButton = styled.button`
  padding: 4px 12px;
  background-color: var(--input);
  color: var(--fg);
  border: 1px solid var(--line);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 5px;

  &:hover {
    background-color: var(--line2);
  }
`;

const Tab = styled.div<{ $active?: boolean }>`
  padding: 8px 0;
  cursor: pointer;
  color: ${props => props.$active ? 'var(--fg)' : 'var(--mute)'};
  font-size: 13px;
  position: relative;
  font-weight: ${props => props.$active ? '500' : 'normal'};

  &:hover {
    color: var(--fg);
  }

  ${props => props.$active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: var(--accent2);
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
    border: 1px solid var(--line);
    border-radius: 4px;
`;

const HeaderRow = styled.div`
    display: flex;
    border-bottom: 1px solid var(--line);
    &:last-child {
        border-bottom: none;
    }
`;

const ReadOnlyInput = styled.input`
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    color: var(--fg);
    border-right: 1px solid var(--line);
    outline: none;
    background-color: var(--surface);
`;

const TestResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  padding: 10px;
`;

const TestResultItem = styled.div<{ $passed: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background-color: ${props => props.$passed ? 'rgba(106, 153, 85, 0.2)' : 'rgba(244, 135, 113, 0.2)'};
  border-left: 3px solid ${props => props.$passed ? 'var(--ok)' : 'var(--err)'};
  border-radius: 4px;
`;

const ResponseBody = styled.textarea`
    width: 100%;
    height: 100%;
    flex: 1;
    background-color: var(--bg);
    color: var(--fg);
    border: none;
    padding: 10px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    resize: none;
    outline: none;
`;

const computeFormat = (content: any): string => {
  if (content === null || content === undefined) return '';
  if (typeof content === 'object') {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return content.toString();
    }
  }
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
};

// Single-entry cache: re-renders (tab switches, resize) don't re-format large bodies
let lastRaw: any;
let lastFormatted = '';
const formatBody = (content: any): string => {
  if (content !== lastRaw || lastFormatted === '' ) {
    lastFormatted = computeFormat(content);
    lastRaw = content;
  }
  return lastFormatted;
};

export const ResponseViewer = observer(() => {
  const { response, loading, error, responseMetrics } = requestStore;
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'preview' | 'tests' | 'tree' | 'timeline'>('body');

  if (loading) {
    return (
        <ViewerContainer $empty>
            <Loader>Loading...</Loader>
        </ViewerContainer>
    );
  }

  if (error) {
       return (
        <ViewerContainer $empty>
            <PlaceholderText>Error: {error.message}</PlaceholderText>
        </ViewerContainer>
    );
  }

  if (!response) {
    return (
        <ViewerContainer $empty>
            <Radar aria-hidden><i /><i /><i /><b /></Radar>
            <PlaceholderText>Enter URL and click Send to get a response</PlaceholderText>
        </ViewerContainer>
    );
  }

  const data = response.data;
  const status = response.status;
  const statusText = response.statusText;
  const headers = response.headers;
  const testResults = response.testResults || [];
  const passedCount = testResults.filter((t: any) => t.passed).length;
  const totalTests = testResults.length;

  const handleCopy = () => {
    const text = formatBody(data);
    navigator.clipboard.writeText(text).catch(err => console.error('Failed to copy: ', err));
  };

  const handleDownload = () => {
    const text = formatBody(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'response.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ViewerContainer>
      <ResponseMeta>
          <div className="status-label">Status: <StatusValue status={status}>{status} {statusText}</StatusValue></div>
          <MetaInfo>Time: {responseMetrics.time}ms</MetaInfo>
          <MetaInfo>Size: {responseMetrics.size}</MetaInfo>
      </ResponseMeta>

      <Tabs>
        <Tab $active={activeTab === 'body'} onClick={() => setActiveTab('body')}>Body</Tab>
        <Tab $active={activeTab === 'preview'} onClick={() => setActiveTab('preview')}>Preview</Tab>
        <Tab $active={activeTab === 'tree'} onClick={() => setActiveTab('tree')}>Tree</Tab>
        <Tab $active={activeTab === 'headers'} onClick={() => setActiveTab('headers')}>Headers</Tab>
        <Tab $active={activeTab === 'tests'} onClick={() => setActiveTab('tests')}>Test Results ({passedCount}/{totalTests})</Tab>
        <Tab $active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>Timeline</Tab>
        {activeTab === 'body' && (
            <>
                <Spacer />
                <ActionButton onClick={handleCopy} title="Copy to Clipboard">Copy</ActionButton>
                <div style={{ width: 10 }} />
                <ActionButton onClick={handleDownload} title="Download Response">Download</ActionButton>
            </>
        )}
      </Tabs>

      <TabContent>
        {activeTab === 'body' && (
             <ResponseBody
                readOnly
                value={formatBody(data)}
             />
        )}
        {activeTab === 'preview' && (
            <iframe
                title="Response Preview"
                srcDoc={typeof data === 'string' ? data : JSON.stringify(data)}
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'white' }}
                sandbox="allow-scripts"
            />
        )}
        {activeTab === 'tree' && <JsonTree data={data} />}
        {activeTab === 'timeline' && <Timeline timing={response.timing} />}
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
        {activeTab === 'tests' && (
            <TestResultsList>
                {testResults.length === 0 && <div style={{ color: 'var(--mute)' }}>No tests executed</div>}
                {testResults.map((test: any, index: number) => (
                    <TestResultItem key={index} $passed={test.passed}>
                        <span>{test.name}</span>
                        <span>{test.passed ? 'PASS' : 'FAIL'}</span>
                        {test.message && <span> - {test.message}</span>}
                    </TestResultItem>
                ))}
            </TestResultsList>
        )}
      </TabContent>
    </ViewerContainer>
  );
});

export default ResponseViewer;
