import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import RequestEditor from './components/RequestEditor';
import ResponseViewer from './components/ResponseViewer';

function App() {
  // --- Request State ---
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');

  // --- Response State ---
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- History State ---
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('requestHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('requestHistory', JSON.stringify(history));
  }, [history]);

  const handleSend = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    // Save to history
    const newHistoryItem = {
      id: Date.now().toString(),
      method,
      url,
      date: new Date().toISOString()
      // We could save headers/body too if we want full restore
    };

    // Add to top, prevent duplicates of exact same request if desired (simple dedup)
    setHistory(prev => {
        const filtered = prev.filter(item => !(item.method === method && item.url === url));
        return [newHistoryItem, ...filtered].slice(0, 50); // Keep last 50
    });

    try {
      const validHeaders = headers.filter(h => h.key.trim() !== '');

      const result = await window.electronAPI.makeRequest({
        url,
        method,
        headers: validHeaders,
        body
      });

      setResponse(result);
    } catch (err) {
      console.error(err);
      setResponse({
        status: 0,
        statusText: 'Error',
        data: err.message,
        headers: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryItem = (item) => {
      setMethod(item.method);
      setUrl(item.url);
      // For now we don't save headers/body in history item to keep it simple,
      // but in a real app we should.
      // If we want to implement that later, we'd add it to newHistoryItem above.
  };

  const clearHistory = () => {
      if (confirm('Clear all history?')) {
          setHistory([]);
      }
  }

  return (
    <div className="app-container">
      <Sidebar
        history={history}
        onSelect={loadHistoryItem}
        onClear={clearHistory}
      />

      <div className="main-content">
          <RequestEditor
            method={method}
            setMethod={setMethod}
            url={url}
            setUrl={setUrl}
            headers={headers}
            setHeaders={setHeaders}
            body={body}
            setBody={setBody}
            onSend={handleSend}
            loading={loading}
          />

          <ResponseViewer
            response={response}
            loading={loading}
            error={error}
          />
      </div>
    </div>
  );
}

export default App;
