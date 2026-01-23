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

const Tab = styled.div<{ $active?: boolean }>`
  padding: 8px 0;
  cursor: pointer;
  color: ${props => props.$active ? '#cccccc' : '#858585'};
  font-size: 13px;
  position: relative;
  font-weight: ${props => props.$active ? '500' : 'normal'};

  &:hover {
    color: #cccccc;
  }

  ${props => props.$active && `
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

const HeaderRow = styled.div<{ $label?: boolean }>`
    display: flex;
    border-bottom: 1px solid #3e3e42;
    background-color: ${props => props.$label ? '#2a2d2e' : 'transparent'};
    font-weight: ${props => props.$label ? 'bold' : 'normal'};
    font-size: ${props => props.$label ? '12px' : 'inherit'};

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

const SaveBtn = styled.button`
  padding: 8px 16px;
  background-color: #3c3c3c;
  color: #cccccc;
  border: 1px solid #3e3e42;
  cursor: pointer;
  margin-left: 10px;
  border-radius: 4px;

  &:hover {
    background-color: #4c4c4c;
  }
`;

export const RequestEditor = observer(() => {
  const {
      method, setMethod,
      url, setUrl,
      headers, setHeaders,
      queryParams, setQueryParams,
      body, setBody,
      bodyType, setBodyType,
      bodyFormData, setBodyFormData,
      bodyUrlEncoded, setBodyUrlEncoded,
      auth, setAuth,
      preRequestScript, setPreRequestScript,
      testScript, setTestScript,
      sendRequest, loading,
      collections, saveRequestToCollection
  } = requestStore;

  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'prerequest' | 'tests'>('params');

  const handleSave = () => {
    if (collections.length === 0) {
      alert('Create a collection first!');
      return;
    }

    const name = prompt('Enter request name:');
    if (!name) return;

    // Simple prompt to choose collection if multiple (or default to first)
    // For simplicity, we just pick the first one or ask user to enter ID if we had a UI for it.
    // Let's just prompt for collection name if there are multiple, or show a simple list in prompt?
    // "Simple" version: just pick the first one or ask user to copy ID.
    // Better: prompt "Enter Collection Index (0 - " + (collections.length - 1) + "):"

    let collectionId = collections[0].id;
    if (collections.length > 1) {
        const collectionNames = collections.map((c, i) => `${i}: ${c.name}`).join('\n');
        const indexStr = prompt(`Select Collection Index:\n${collectionNames}`, "0");
        const index = parseInt(indexStr || "0");
        if (!isNaN(index) && collections[index]) {
            collectionId = collections[index].id;
        } else {
             return;
        }
    }

    saveRequestToCollection(collectionId, name);
    alert('Saved!');
  };

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
    const newHeaders = headers.filter((_, i) => i !== index);
    setHeaders(newHeaders);
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
    const newParams = queryParams.filter((_, i) => i !== index);
    setQueryParams(newParams);
  }

  const handleFormDataChange = (index: number, field: 'key' | 'value' | 'type', value: string) => {
    const newData = bodyFormData.map(i => ({ ...i }));
    (newData[index] as any)[field] = value;

    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '', type: 'text' });
    }

    setBodyFormData(newData);
  };

  const removeFormData = (index: number) => {
    setBodyFormData(bodyFormData.filter((_, i) => i !== index));
  };

  const handleUrlEncodedChange = (index: number, field: 'key' | 'value', value: string) => {
    const newData = bodyUrlEncoded.map(i => ({ ...i }));
    (newData[index] as any)[field] = value;

    if (index === newData.length - 1 && (newData[index].key || newData[index].value)) {
      newData.push({ key: '', value: '' });
    }

    setBodyUrlEncoded(newData);
  };

  const removeUrlEncoded = (index: number) => {
    setBodyUrlEncoded(bodyUrlEncoded.filter((_, i) => i !== index));
  };

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
        <SaveBtn onClick={handleSave}>Save</SaveBtn>
      </RequestBar>

      <Tabs>
        <Tab $active={activeTab === 'params'} onClick={() => setActiveTab('params')}>Params ({queryParams.filter(p => p.key).length})</Tab>
        <Tab $active={activeTab === 'auth'} onClick={() => setActiveTab('auth')}>Auth</Tab>
        <Tab $active={activeTab === 'headers'} onClick={() => setActiveTab('headers')}>Headers ({headers.filter(h => h.key).length})</Tab>
        <Tab $active={activeTab === 'body'} onClick={() => setActiveTab('body')}>Body</Tab>
        <Tab $active={activeTab === 'prerequest'} onClick={() => setActiveTab('prerequest')}>Pre-req</Tab>
        <Tab $active={activeTab === 'tests'} onClick={() => setActiveTab('tests')}>Tests</Tab>
      </Tabs>

      <TabContent>
        {activeTab === 'params' && (
            <ParamsEditor>
                <HeadersGrid>
                    <HeaderRow $label>
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

        {activeTab === 'auth' && (
          <BodyEditor>
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <label style={{ width: 80 }}>Type:</label>
                <select
                  value={auth.type}
                  onChange={(e) => setAuth({ ...auth, type: e.target.value as any })}
                  style={{ padding: 5, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                >
                  <option value="none">No Auth</option>
                  <option value="basic">Basic Auth</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                </select>
              </div>

              {auth.type === 'basic' && (
                <>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ width: 80 }}>Username:</label>
                    <input
                      type="text"
                      value={auth.username || ''}
                      onChange={(e) => setAuth({ ...auth, username: e.target.value })}
                      style={{ padding: 5, flex: 1, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                      placeholder="Username"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <label style={{ width: 80 }}>Password:</label>
                    <input
                      type="password"
                      value={auth.password || ''}
                      onChange={(e) => setAuth({ ...auth, password: e.target.value })}
                      style={{ padding: 5, flex: 1, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                      placeholder="Password"
                    />
                  </div>
                </>
              )}

              {auth.type === 'bearer' && (
                 <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                   <label style={{ width: 80 }}>Token:</label>
                   <input
                     type="text"
                     value={auth.token || ''}
                     onChange={(e) => setAuth({ ...auth, token: e.target.value })}
                     style={{ padding: 5, flex: 1, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                     placeholder="Bearer Token"
                   />
                 </div>
              )}

              {auth.type === 'apikey' && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                     <label style={{ width: 80 }}>Key:</label>
                     <input
                       type="text"
                       value={auth.apiKey?.key || ''}
                       onChange={(e) => setAuth({ ...auth, apiKey: { key: e.target.value, value: auth.apiKey?.value || '', addTo: auth.apiKey?.addTo || 'header' } })}
                       style={{ padding: 5, flex: 1, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                       placeholder="Key"
                     />
                   </div>
                   <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                     <label style={{ width: 80 }}>Value:</label>
                     <input
                       type="text"
                       value={auth.apiKey?.value || ''}
                       onChange={(e) => setAuth({ ...auth, apiKey: { key: auth.apiKey?.key || '', value: e.target.value, addTo: auth.apiKey?.addTo || 'header' } })}
                       style={{ padding: 5, flex: 1, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                       placeholder="Value"
                     />
                   </div>
                   <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                     <label style={{ width: 80 }}>Add To:</label>
                     <select
                       value={auth.apiKey?.addTo || 'header'}
                       onChange={(e) => setAuth({ ...auth, apiKey: { key: auth.apiKey?.key || '', value: auth.apiKey?.value || '', addTo: e.target.value as any } })}
                       style={{ padding: 5, backgroundColor: '#3c3c3c', color: '#cccccc', border: '1px solid #3e3e42', outline: 'none' }}
                     >
                       <option value="header">Header</option>
                       <option value="query">Query Params</option>
                     </select>
                   </div>
                 </div>
              )}
            </div>
            <div style={{ padding: 10, color: '#858585', fontSize: 12 }}>
              Authorization header/params will be automatically generated.
            </div>
          </BodyEditor>
        )}

        {activeTab === 'headers' && (
          <HeadersGrid>
            <HeaderRow $label>
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
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'text'}
                        onChange={() => setBodyType('text')}
                    /> Raw (Text)
                 </label>
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'json'}
                        onChange={() => setBodyType('json')}
                    /> JSON
                 </label>
                 <label style={{ marginRight: 15, cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'form-data'}
                        onChange={() => setBodyType('form-data')}
                    /> Form Data
                 </label>
                 <label style={{ cursor: 'pointer' }}>
                    <input
                        type="radio"
                        name="body-type"
                        checked={bodyType === 'x-www-form-urlencoded'}
                        onChange={() => setBodyType('x-www-form-urlencoded')}
                    /> x-www-form-urlencoded
                 </label>
             </BodyOptions>

             {(bodyType === 'text' || bodyType === 'json') && (
                 <CodeEditor
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={bodyType === 'json' ? "Request Body (JSON)" : "Request Body (Text)"}
                  />
             )}

             {bodyType === 'form-data' && (
                <HeadersGrid>
                    <HeaderRow $label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {bodyFormData.map((item, index) => (
                    <HeaderRow key={index}>
                        <HeaderInput
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => handleFormDataChange(index, 'key', e.target.value)}
                        />
                        <HeaderInput
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleFormDataChange(index, 'value', e.target.value)}
                        />
                         <ColAction>
                        {bodyFormData.length > 1 && index !== bodyFormData.length - 1 && (
                            <RemoveBtn onClick={() => removeFormData(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
             )}

             {bodyType === 'x-www-form-urlencoded' && (
                <HeadersGrid>
                    <HeaderRow $label>
                        <ColLabel>Key</ColLabel>
                        <ColLabel>Value</ColLabel>
                        <ColAction></ColAction>
                    </HeaderRow>
                    {bodyUrlEncoded.map((item, index) => (
                    <HeaderRow key={index}>
                        <HeaderInput
                            placeholder="Key"
                            value={item.key}
                            onChange={(e) => handleUrlEncodedChange(index, 'key', e.target.value)}
                        />
                        <HeaderInput
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => handleUrlEncodedChange(index, 'value', e.target.value)}
                        />
                         <ColAction>
                        {bodyUrlEncoded.length > 1 && index !== bodyUrlEncoded.length - 1 && (
                            <RemoveBtn onClick={() => removeUrlEncoded(index)}>✕</RemoveBtn>
                        )}
                        </ColAction>
                    </HeaderRow>
                    ))}
                </HeadersGrid>
             )}
           </BodyEditor>
        )}

        {activeTab === 'prerequest' && (
           <BodyEditor>
             <BodyOptions>Pre-request Script (Javascript)</BodyOptions>
             <CodeEditor
                value={preRequestScript}
                onChange={(e) => setPreRequestScript(e.target.value)}
                placeholder="// Write your pre-request script here"
              />
           </BodyEditor>
        )}

        {activeTab === 'tests' && (
           <BodyEditor>
             <BodyOptions>Tests (Javascript)</BodyOptions>
             <CodeEditor
                value={testScript}
                onChange={(e) => setTestScript(e.target.value)}
                placeholder={'// Write your tests here\n// pm.test("Status code is 200", function () {\n//     pm.response.to.have.status(200);\n// });'}
              />
           </BodyEditor>
        )}
      </TabContent>
    </EditorContainer>
  );
});

export default RequestEditor;
