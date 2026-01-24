import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { requestStore } from '../stores/RequestStore';
import { generateCurl, generateFetch, RequestData } from '../utils/codeGenerator';
import { observer } from 'mobx-react-lite';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #252526;
  border: 1px solid #3e3e42;
  width: 600px;
  height: 400px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
`;

const Header = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #3e3e42;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: #fff;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #cccccc;
  cursor: pointer;
  font-size: 16px;
  &:hover { color: #fff; }
`;

const Tabs = styled.div`
  display: flex;
  border-bottom: 1px solid #3e3e42;
  background-color: #2d2d2d;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 10px 20px;
  background: ${props => props.$active ? '#252526' : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.$active ? '#0078d4' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#858585'};
  cursor: pointer;

  &:hover {
    color: #fff;
  }
`;

const CodeArea = styled.textarea`
  flex: 1;
  background-color: #1e1e1e;
  color: #d4d4d4;
  border: none;
  padding: 15px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  resize: none;
  outline: none;
`;

const Footer = styled.div`
  padding: 10px 15px;
  border-top: 1px solid #3e3e42;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  padding: 6px 12px;
  background-color: #0078d4;
  color: white;
  border: 1px solid #0078d4;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background-color: #0063b1; }
`;

interface Props {
  onClose: () => void;
}

export const CodeSnippetModal = observer(({ onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<'curl' | 'fetch'>('curl');
  const [code, setCode] = useState('');

  useEffect(() => {
      const { method, url, headers, bodyType, body, bodyFormData, bodyUrlEncoded, queryParams, auth } = requestStore;

      let finalHeaders = [...headers.filter(h => h.key)];
      let finalUrl = url;

      if (auth.type === 'basic') {
          const token = btoa(`${auth.username || ''}:${auth.password || ''}`);
          finalHeaders.push({ key: 'Authorization', value: `Basic ${token}` });
      } else if (auth.type === 'bearer') {
          finalHeaders.push({ key: 'Authorization', value: `Bearer ${auth.token || ''}` });
      } else if (auth.type === 'apikey' && auth.apiKey) {
          if (auth.apiKey.addTo === 'header') {
              finalHeaders.push({ key: auth.apiKey.key, value: auth.apiKey.value });
          } else if (auth.apiKey.addTo === 'query') {
              const separator = finalUrl.includes('?') ? '&' : '?';
              finalUrl = `${finalUrl}${separator}${auth.apiKey.key}=${encodeURIComponent(auth.apiKey.value)}`;
          }
      }

      const reqData: RequestData = {
          method,
          url: finalUrl,
          headers: finalHeaders,
          bodyType,
          body,
          bodyFormData,
          bodyUrlEncoded,
          queryParams
      };

      if (activeTab === 'curl') {
          setCode(generateCurl(reqData));
      } else {
          setCode(generateFetch(reqData));
      }
  }, [activeTab, requestStore.method, requestStore.url, requestStore.headers, requestStore.body, requestStore.auth, requestStore.bodyType, requestStore.bodyFormData, requestStore.bodyUrlEncoded, requestStore.queryParams]);

  const handleCopy = () => {
      navigator.clipboard.writeText(code);
      alert('Copied to clipboard!');
  };

  return (
    <Overlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Header>
          <span>Generate Code</span>
          <CloseBtn onClick={onClose}>✕</CloseBtn>
        </Header>
        <Tabs>
          <Tab $active={activeTab === 'curl'} onClick={() => setActiveTab('curl')}>cURL</Tab>
          <Tab $active={activeTab === 'fetch'} onClick={() => setActiveTab('fetch')}>Fetch</Tab>
        </Tabs>
        <CodeArea value={code} readOnly />
        <Footer>
          <Button onClick={handleCopy}>Copy</Button>
        </Footer>
      </ModalContent>
    </Overlay>
  );
});
