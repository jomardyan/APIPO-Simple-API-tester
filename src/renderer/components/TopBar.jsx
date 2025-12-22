import React from "react";
import { Plus, Settings } from "lucide-react";

const TopBar = React.forwardRef(
  (
    {
      version,
      theme,
      onToggleSettings,
      onNewRequest,
      environments,
      activeEnvironmentId,
      onEnvironmentChange,
    },
    ref
  ) => {
    return (
      <header className="top-bar" ref={ref}>
        <div className="brand">
          <div className="brand-mark">Q</div>
          <div className="brand-meta">
            <div className="brand-title">Quick API Client</div>
            <div className="brand-subtitle">v{version || "0.1.0"}</div>
          </div>
        </div>
        <div className="top-actions">
          <select
            value={activeEnvironmentId}
            onChange={(e) => onEnvironmentChange?.(e.target.value)}
            title="Active environment"
          >
            {environments.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
              </option>
            ))}
            {!environments.length && <option value="">No environment</option>}
          </select>
          <div className="pill">{theme}</div>
          <button className="ghost" onClick={onNewRequest} title="New Request">
            <Plus size={16} />
            <span>New</span>
          </button>
          <button className="ghost" onClick={onToggleSettings} title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </header>
    );
  }
);

TopBar.displayName = "TopBar";

export default TopBar;
