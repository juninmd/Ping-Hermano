import React, { useState } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { requestStore } from '../stores/RequestStore';

const EditorContainer = styled.div`
  padding: 15px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const RequestBar = styled.div`
  display: flex;
  gap: 0;
`;

const MethodSelect = styled.select`
  padding: 8px 12px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #3e3e42;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-weight: bold;
  width: 100px;
  outline: none;
`;

const UrlInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #3e3e42;
  outline: none;

  &:focus {
      border-color: #0078d4;
  }
`;

const SendBtn = styled.button`
  padding: 8px 24px;
  background-color: #0078d4;
  color: white;
  border: 1px solid #0078d4;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #0063b1;
  }

  &:disabled {
    background-color: #444;
    border-color: #444;
    cursor: not-allowed;
  }
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

const HeaderRow = styled.div<{ label?: boolean }>`
    display: flex;
    border-bottom: 1px solid #3e3e42;
    background-color: ${props => props.label ? '#2a2d2e' : 'transparent'};
    font-weight: ${props => props.label ? 'bold' : 'normal'};
    font-size: ${props => props.label ? '12px' : 'inherit'};

    &:last-child {
        border-bottom: none;
    }
`;

const ColLabel = styled.span`
    flex: 1;
    padding: 8px;
    border-right: 1px solid #3e3e42;
`;

const ColAction = styled.span`
    width: 30px;
`;

const HeaderInput = styled.input`
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    color: #cccccc;
    border-right: 1px solid #3e3e42;
    outline: none;

    &:focus {
        background-color: #2a2d2e;
    }
`;

const RemoveBtn = styled.button`
    width: 30px;
    background: none;
    border: none;
    color: #858585;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        color: #f48771;
    }
`;

const BodyEditor = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 10px;
`;

const BodyOptions = styled.div`
    font-size: 12px;
    color: #858585;
`;

const CodeEditor = styled.textarea`
    width: 100%;
    height: 100%;
    flex: 1;
    background-color: #3c3c3c;
    color: #d4d4d4;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    padding: 10px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    resize: none;
    outline: none;
`;

const ParamsEditor = styled.div`
  /* Reuse HeadersGrid styles if needed, or add specific overrides */
`;

const RequestEditor = observer(() => {
  const {
      method, setMethod,
      url, setUrl,
      headers, setHeaders,
      queryParams, setQueryParams,
      body, setBody,
      sendRequest, loading
  } = requestStore;

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params');

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaders = headers.map(h => ({ ...h }));
    newHeaders[index][field] = value;

    if (index === newHeaders.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }

    setHeaders(newHeaders);
  };

  const removeHeader = (index: number) => {
    if (headers.length > 1) {
        const newHeaders = headers.filter((_, i) => i !== index);
        setHeaders(newHeaders);
    } else {
        setHeaders([{ key: '', value: '' }]);
    }
  }

  const handleParamChange = (index: number, field: 'key' | 'value', value: string) => {
    const newParams = queryParams.map(p => ({ ...p }));
    newParams[index][field] = value;

    if (index === newParams.length - 1 && (newParams[index].key || newParams[index].value)) {
      newParams.push({ key: '', value: '' });
    }

    setQueryParams(newParams);
  };

  const removeParam = (index: number) => {
    if (queryParams.length > 1) {
        const newParams = queryParams.filter((_, i) => i !== index);
        setQueryParams(newParams);
    } else {
        setQueryParams([{ key: '', value: '' }]);
    }
  }

  return (
    <EditorContainer>
      <RequestBar>
        <MethodSelect value={method} onChange={(e) => setMethod(e.target.value)}>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </MethodSelect>
        <UrlInput
          type="text"
          placeholder="Enter request URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
             if (e.key === 'Enter') sendRequest();
          }}
        />
        <SendBtn onClick={() => sendRequest()} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </SendBtn>
      </RequestBar>

      <Tabs>
        <Tab active={activeTab === 'params'} onClick={() => setActiveTab('params')}>Params ({queryParams.filter(p => p.key).length})</Tab>
        <Tab active={activeTab === 'headers'} onClick={() => setActiveTab('headers')}>Headers ({headers.filter(h => h.key).length})</Tab>
        <Tab active={activeTab === 'body'} onClick={() => setActiveTab('body')}>Body</Tab>
      </Tabs>

      <TabContent>
        {activeTab === 'params' && (
            <ParamsEditor>
                <HeadersGrid>
                    <HeaderRow label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {queryParams.map((param, index) => (
                    <HeaderRow key={index}>
                        <HeaderInput
                        placeholder="Key"
                        value={param.key}
                        onChange={(e) => handleParamChange(index, 'key', e.target.value)}
                        />
                        <HeaderInput
                        placeholder="Value"
                        value={param.value}
                        onChange={(e) => handleParamChange(index, 'value', e.target.value)}
                        />
                        <ColAction>
                        {queryParams.length > 1 && index !== queryParams.length - 1 && (
                            <RemoveBtn onClick={() => removeParam(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
            </ParamsEditor>
        )}

        {activeTab === 'headers' && (
          <HeadersGrid>
            <HeaderRow label>
                <ColLabel>Key</ColLabel>
                <ColLabel>Value</ColLabel>
                <ColAction></ColAction>
            </HeaderRow>
            {headers.map((header, index) => (
              <HeaderRow key={index}>
                <HeaderInput
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <HeaderInput
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
                <ColAction>
                {headers.length > 1 && index !== headers.length - 1 && (
                     <RemoveBtn onClick={() => removeHeader(index)}>✕</RemoveBtn>
                )}
                </ColAction>
              </HeaderRow>
            ))}
          </HeadersGrid>
        )}

        {activeTab === 'body' && (
           <BodyEditor>
             <BodyOptions>
                 <label><input type="radio" name="body-type" checked readOnly /> raw</label>
             </BodyOptions>
             <CodeEditor
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request Body (JSON, XML, Text...)"
              />
           </BodyEditor>
        )}
      </TabContent>
    </EditorContainer>
  );
});

export default RequestEditor;
