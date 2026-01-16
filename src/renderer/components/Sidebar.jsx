import React from 'react';

function Sidebar({ history, onSelect, onClear }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>History</h3>
        <button className="clear-btn" onClick={onClear} title="Clear History">🗑️</button>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-history">No history yet</div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="history-item"
              onClick={() => onSelect(item)}
            >
              <span className={`method-badge ${item.method.toLowerCase()}`}>{item.method}</span>
              <span className="url-truncate" title={item.url}>{item.url}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Sidebar;
