import React from 'react';

const BulkRunner = ({
  queue,
  results,
  onAddCurrent,
  onRun,
  onClear,
  onRemove,
  isRunning
}) => {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <div className="section-title">Bulk Queue</div>
          <div className="muted small">Run multiple requests sequentially</div>
        </div>
        <div className="pill">{queue.length} queued</div>
      </div>

      <div className="row">
        <button className="ghost" type="button" onClick={onAddCurrent}>
          Add current request
        </button>
        <button className="primary" type="button" onClick={onRun} disabled={!queue.length || isRunning}>
          {isRunning ? 'Running…' : 'Run queue'}
        </button>
        <button className="ghost" type="button" onClick={onClear} disabled={!queue.length || isRunning}>
          Clear
        </button>
      </div>

      <div className="collections-list">
        {queue.map((item) => (
          <div key={item.id} className="collection-item">
            <div className="pill">{item.request.method}</div>
            <div className="history-meta">
              <div className="history-url">{item.request.url || 'Untitled'}</div>
              <div className="muted">{item.request.preRequestScript ? 'with script' : 'no script'}</div>
            </div>
            <button className="icon-btn" type="button" onClick={() => onRemove(item.id)}>
              ×
            </button>
          </div>
        ))}
        {!queue.length && <div className="muted">Queue is empty. Add the current request to begin.</div>}
      </div>

      {results.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Results</div>
          </div>
          <div className="history-list">
            {results.map((res) => (
              <div key={res.id} className="history-item">
                <div className={`pill ${res.response?.error ? 'danger' : 'success'}`}>
                  {res.request.method}
                </div>
                <div className="history-meta">
                  <div className="history-url">{res.request.url}</div>
                  <div className="muted">
                    {res.response?.status ?? '—'} · {res.response?.duration ?? 0}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkRunner;
