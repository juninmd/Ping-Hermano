import React, { useState, useEffect } from 'react';

function RequestEditor({ method, setMethod, url, setUrl, headers, setHeaders, body, setBody, onSend, loading }) {
  const [activeTab, setActiveTab] = useState('params'); // 'params', 'headers', 'body'

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

  const removeHeader = (index) => {
    if (headers.length > 1) {
        const newHeaders = headers.filter((_, i) => i !== index);
        setHeaders(newHeaders);
    } else {
        setHeaders([{ key: '', value: '' }]);
    }
  }

  return (
    <div className="request-editor">
      {/* Request Bar */}
      <div className="request-bar">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="method-select">
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          type="text"
          placeholder="Enter request URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="url-input"
          onKeyDown={(e) => {
             if (e.key === 'Enter') onSend();
          }}
        />
        <button onClick={onSend} disabled={loading} className="send-btn">
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Params</div>
        <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers ({headers.filter(h => h.key).length})</div>
        <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
      </div>

      <div className="tab-content">
        {activeTab === 'params' && (
            <div className="params-editor">
                <div className="empty-state">Query params support coming soon (edit URL directly for now)</div>
            </div>
        )}

        {activeTab === 'headers' && (
          <div className="headers-grid">
            <div className="header-row label-row">
                <span className="col-label">Key</span>
                <span className="col-label">Value</span>
                <span className="col-action"></span>
            </div>
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
                {headers.length > 1 && index !== headers.length - 1 && (
                     <button className="remove-btn" onClick={() => removeHeader(index)}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'body' && (
           <div className="body-editor">
             <div className="body-options">
                 <label><input type="radio" name="body-type" checked readOnly /> raw</label>
                 {/* Future: form-data, x-www-form-urlencoded */}
             </div>
             <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Request Body (JSON, XML, Text...)"
                className="code-editor"
              />
           </div>
        )}
      </div>
    </div>
  );
}

export default RequestEditor;
