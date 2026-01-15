import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RequestTabs from './components/RequestTabs';
import ResponsePanel from './components/ResponsePanel';

function App() {
  const [history, setHistory] = useState([]);
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState([{ key: '', value: '' }]);
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('params'); // 'params' | 'headers' | 'body'

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  useEffect(() => {
    const savedHistory = localStorage.getItem('requestHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  // Update Params when URL changes (user types in URL)
  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    const parts = newUrl.split('?');
    if (parts.length > 1) {
        const query = parts.slice(1).join('?');
        const searchParams = new URLSearchParams(query);
        const newParams = [];
        searchParams.forEach((value, key) => {
            newParams.push({ key, value });
        });
        newParams.push({ key: '', value: '' });
        setParams(newParams);
    } else {
        setParams([{ key: '', value: '' }]);
    }
  };

  // Update URL when Params change (user types in Params table)
  const updateParams = (newParams) => {
    setParams(newParams);

    // Construct new URL
    try {
        // We need a base to use URL object, if url is relative or empty, this is tricky.
        // If empty, assume http://localhost for construction then strip it?
        let baseUrlStr = url.split('?')[0];
        if (!baseUrlStr) baseUrlStr = '';

        const queryString = newParams
            .filter(p => p.key)
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&');

        if (queryString) {
            setUrl(`${baseUrlStr}?${queryString}`);
        } else {
            setUrl(baseUrlStr);
        }
    } catch (e) {
        console.error("Error constructing URL from params", e);
    }
  };

  const handleSend = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      // Filter empty headers
      const validHeaders = headers.filter(h => h.key.trim() !== '');

      const result = await window.electronAPI.makeRequest({
        url,
        method,
        headers: validHeaders,
        body
      });

      setResponse(result);
      addToHistory({ url, method });
    } catch (error) {
      console.error(error);
      setError(error.message);
      setResponse({
        status: 0,
        statusText: 'Error',
        data: error.message,
        headers: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (requestItem) => {
    setHistory(prev => {
        // Remove duplicate if exists (same method and url) to bump it to top
        const filtered = prev.filter(item => !(item.method === requestItem.method && item.url === requestItem.url));
        const newHistory = [requestItem, ...filtered].slice(0, 50);
        localStorage.setItem('requestHistory', JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const loadHistoryItem = (item) => {
      setMethod(item.method);
      setUrl(item.url);

      const parts = item.url.split('?');
      if (parts.length > 1) {
          const query = parts.slice(1).join('?');
          const searchParams = new URLSearchParams(query);
          const newParams = [];
          searchParams.forEach((value, key) => {
              newParams.push({ key, value });
          });
          newParams.push({ key: '', value: '' });
          setParams(newParams);
      } else {
          setParams([{ key: '', value: '' }]);
      }
  };

  const clearHistory = () => {
      setHistory([]);
      localStorage.removeItem('requestHistory');
  };

  return (
    <div className="app-container">
      <Sidebar
        history={history}
        onSelect={loadHistoryItem}
        onClear={clearHistory}
      />

      <div className="main-content">
        <div className="request-bar">
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input
            type="text"
            placeholder="Enter URL"
            value={url}
            onChange={handleUrlChange}
            />
            <button onClick={handleSend} disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
            </button>
        </div>

        <RequestTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            body={body}
            setBody={setBody}
            headers={headers}
            setHeaders={setHeaders}
            params={params}
            setParams={updateParams}
        />

        <ResponsePanel
            response={response}
            loading={loading}
            error={error}
        />
      </div>
    </div>
  );
}

export default App;
