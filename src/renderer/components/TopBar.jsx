import React from 'react';

const TopBar = ({
  version,
  theme,
  onToggleSettings,
  onNewRequest,
  environments,
  activeEnvironmentId,
  onEnvironmentChange
}) => {
  return (
    <header className="top-bar">
      <div className="brand">
        <div className="brand-mark">Q</div>
        <div className="brand-meta">
          <div className="brand-title">Quick API Client</div>
          <div className="brand-subtitle">Desktop · {version || 'dev channel'}</div>
        </div>
      </div>
      <div className="top-actions">
        <select
          className="ghost"
          value={activeEnvironmentId}
          onChange={(e) => onEnvironmentChange?.(e.target.value)}
          title="Active environment"
        >
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              Env: {env.name}
            </option>
          ))}
          {!environments.length && <option value="">No environments</option>}
        </select>
        <div className="pill">Theme: {theme}</div>
        <button className="ghost" onClick={onNewRequest}>
          New Request
        </button>
        <button className="primary" onClick={onToggleSettings}>
          Settings
        </button>
      </div>
    </header>
  );
};

export default TopBar;
