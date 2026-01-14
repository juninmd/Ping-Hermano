import React, { useState } from 'react';

function App() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState([{ key: '', value: '' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('body'); // 'body' | 'headers'
  const [activeResTab, setActiveResTab] = useState('body'); // 'body' | 'headers'

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const handleHeaderChange = (index, field, value) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;

    // Add new row if typing in the last one
    if (index === newHeaders.length - 1 && (newHeaders[index].key || newHeaders[index].value)) {
      newHeaders.push({ key: '', value: '' });
    }

    setHeaders(newHeaders);
  };

  const handleSend = async () => {
    if (!url) {
      alert('Please enter a URL');
      return;
    }

    setLoading(true);
    setResponse(null);

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
    } catch (error) {
      console.error(error);
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

  const formatBody = (content) => {
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
    <div className="container">
      {/* Request Bar */}
      <div className="request-bar">
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="text"
          placeholder="Enter URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Request Details */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
        <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
      </div>

      <div className="tab-content">
        {activeTab === 'body' && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Request Body (JSON, Text, etc.)"
          />
        )}
        {activeTab === 'headers' && (
          <div className="headers-grid">
            {headers.map((header, index) => (
              <div key={index} className="header-row">
                <input
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                />
                <input
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Area */}
      <div className="response-area">
        {response && (
          <>
            <div className="response-status">
              Status: {response.status} {response.statusText}
            </div>

            <div className="tabs">
                <div className={`tab ${activeResTab === 'body' ? 'active' : ''}`} onClick={() => setActiveResTab('body')}>Response Body</div>
                <div className={`tab ${activeResTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveResTab('headers')}>Response Headers</div>
            </div>

            <div className="tab-content">
                {activeResTab === 'body' && (
                    <textarea
                        readOnly
                        value={formatBody(response.data)}
                    />
                )}
                {activeResTab === 'headers' && (
                    <div className="headers-grid">
                        {Object.entries(response.headers).map(([key, value]) => (
                             <div key={key} className="header-row">
                                <input readOnly value={key} />
                                <input readOnly value={value} />
                             </div>
                        ))}
                    </div>
                )}
            </div>
          </>
        )}
        {!response && !loading && <div style={{padding: '10px'}}>Ready to send request.</div>}
      </div>
    </div>
  );
}

export default App;
