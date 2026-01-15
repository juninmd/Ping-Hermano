import React, { useState } from 'react';

function ResponsePanel({ response, loading, error }) {
  const [activeTab, setActiveTab] = useState('body');

  if (loading) return <div className="response-placeholder">Loading...</div>;
  if (error) return <div className="response-placeholder error">Error: {error}</div>;
  if (!response) return <div className="response-placeholder">Enter a URL and send to get a response</div>;

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
    <div className="response-panel">
      <div className="response-status-bar">
        <span className="status-label">Status:</span>
        <span className={`status-code ${response.status >= 200 && response.status < 300 ? 'success' : 'error'}`}>
          {response.status} {response.statusText}
        </span>
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
        <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
      </div>

      <div className="tab-content response-content">
        {activeTab === 'body' && (
            <textarea
                readOnly
                value={formatBody(response.data)}
                className="response-body"
            />
        )}
        {activeTab === 'headers' && (
            <div className="headers-grid">
                {Object.entries(response.headers).map(([key, value]) => (
                        <div key={key} className="header-row read-only">
                        <span className="header-key">{key}</span>
                        <span className="header-value">{value}</span>
                        </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default ResponsePanel;
