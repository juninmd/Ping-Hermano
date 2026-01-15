import React from 'react';
import KeyValueEditor from './KeyValueEditor';

function RequestTabs({
  activeTab,
  setActiveTab,
  body,
  setBody,
  headers,
  setHeaders,
  params,
  setParams
}) {
  return (
    <div className="request-tabs-container">
      <div className="tabs">
        <div className={`tab ${activeTab === 'params' ? 'active' : ''}`} onClick={() => setActiveTab('params')}>Params</div>
        <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
        <div className={`tab ${activeTab === 'body' ? 'active' : ''}`} onClick={() => setActiveTab('body')}>Body</div>
      </div>

      <div className="tab-content">
        {activeTab === 'params' && (
          <KeyValueEditor pairs={params} setPairs={setParams} />
        )}
        {activeTab === 'headers' && (
          <KeyValueEditor pairs={headers} setPairs={setHeaders} />
        )}
        {activeTab === 'body' && (
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Request Body (JSON, Text, etc.)"
            className="body-editor"
          />
        )}
      </div>
    </div>
  );
}

export default RequestTabs;
