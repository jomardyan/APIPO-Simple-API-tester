import React, { useMemo, useState } from 'react';

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const HistoryPanel = ({ history, onSelect, onClear }) => {
  const [query, setQuery] = useState('');
  const items = useMemo(() => {
    const list = history || [];
    if (!query) return list;
    const q = query.toLowerCase();
    return list.filter(
      (h) =>
        h.request.url.toLowerCase().includes(q) ||
        h.request.method.toLowerCase().includes(q) ||
        (h.response?.statusText || '').toLowerCase().includes(q)
    );
  }, [history, query]);

  return (
    <aside className="history-panel">
      <div className="panel-header">
        <div>
          <div className="section-title">History</div>
          <div className="muted">{items.length ? `${items.length} saved` : 'No requests yet'}</div>
        </div>
        <button className="ghost" type="button" onClick={onClear} disabled={!items.length}>
          Clear
        </button>
      </div>
      <input
        type="search"
        placeholder="Search history"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="history-list">
        {items.map((entry) => (
          <button
            key={entry.id}
            className="history-item"
            type="button"
            onClick={() => onSelect(entry)}
          >
            <div className={`pill ${entry.response?.error ? 'danger' : 'success'}`}>
              {entry.request.method}
            </div>
            <div className="history-meta">
              <div className="history-url">{entry.request.url || 'Untitled request'}</div>
              <div className="muted">
                {formatTime(entry.timestamp)} ·{' '}
                {entry.response?.status ? entry.response.status : 'No status'}
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default HistoryPanel;
