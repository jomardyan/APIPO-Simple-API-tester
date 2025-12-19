import React from 'react';
import { THEMES } from '#shared/constants';
import EnvironmentManager from './EnvironmentManager';

const SettingsPanel = ({
  open,
  settings,
  onClose,
  onChange,
  environments,
  activeEnvironmentId,
  onAddEnvironment,
  onUpdateEnvironment,
  onDeleteEnvironment,
  onSetActiveEnvironment
}) => {
  const handleThemeChange = (event) => onChange({ theme: event.target.value });
  const handleTimeoutChange = (event) =>
    onChange({ timeout: Number(event.target.value) || settings.timeout });

  return (
    <div className={`settings-drawer ${open ? 'open' : ''}`}>
      <div className="panel-header">
        <div>
          <div className="section-title">Settings</div>
          <div className="muted">Stored locally on this device</div>
        </div>
        <button className="ghost" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="section">
        <label className="stacked">
          <span className="label">Theme</span>
          <select value={settings.theme} onChange={handleThemeChange}>
            {THEMES.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="section">
        <label className="stacked">
          <span className="label">Request timeout (ms)</span>
          <input
            type="number"
            min={1000}
            step={500}
            value={settings.timeout}
            onChange={handleTimeoutChange}
          />
        </label>
        <div className="muted small">Applied to every request in this session.</div>
      </div>

      <EnvironmentManager
        environments={environments}
        activeId={activeEnvironmentId}
        onAdd={onAddEnvironment}
        onUpdate={onUpdateEnvironment}
        onDelete={onDeleteEnvironment}
        onSetActive={onSetActiveEnvironment}
      />
    </div>
  );
};

export default SettingsPanel;
