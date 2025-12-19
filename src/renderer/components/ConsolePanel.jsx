import React from 'react';

const ConsolePanel = ({ logs, onClear }) => {
  return (
    <div className="panel console-panel">
      <div className="panel-header">
        <div className="section-title">Console</div>
        <button className="ghost" type="button" onClick={onClear} disabled={!logs.length}>
          Clear
        </button>
      </div>
      <div className="console-body">
        {logs.length === 0 && <div className="muted">No logs yet.</div>}
        {logs.map((log) => (
          <div key={log.id} className="console-line">
            <div className="pill">{log.type}</div>
            <div className="console-message">{log.message}</div>
            <div className="muted small">{new Date(log.timestamp).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConsolePanel;
