import React, { useState } from 'react';

function ResponseViewer({ response, loading, error }) {
  const [activeTab, setActiveTab] = useState('body');

  if (loading) {
    return (
        <div className="response-viewer empty">
            <div className="loader">Loading...</div>
        </div>
    );
  }

  if (!response && !error) {
    return (
        <div className="response-viewer empty">
            <div className="placeholder-text">Enter URL and click Send to get a response</div>
        </div>
    );
  }

  const data = response ? response.data : null;
  const status = response ? response.status : 0;
  const statusText = response ? response.statusText : '';
  const headers = response ? response.headers : {};

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

  const getStatusColor = (s) => {
      if (s >= 200 && s < 300) return 'text-green';
      if (s >= 300 && s < 400) return 'text-yellow';
      if (s >= 400 && s < 600) return 'text-red';
      return '';
  }

  return (
    <div className="response-viewer">
      <div className="response-meta">
          <div className="status-label">Status: <span className={`status-value ${getStatusColor(status)}`}>{status} {statusText}</span></div>
          <div className="meta-info">Time: --ms</div> {/* Placeholder for now */}
          <div className="meta-info">Size: --KB</div> {/* Placeholder for now */}
      </div>

      <div className="tabs">
        <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
        <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
      </div>

      <div className="tab-content">
        {activeTab === 'body' && (
             <textarea
                readOnly
                value={formatBody(data)}
                className="code-editor response-body"
             />
        )}
        {activeTab === 'headers' && (
            <div className="headers-grid">
                {Object.entries(headers).map(([key, value]) => (
                        <div key={key} className="header-row">
                        <input readOnly value={key} className="readonly-input" />
                        <input readOnly value={value} className="readonly-input" />
                        </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

export default ResponseViewer;
