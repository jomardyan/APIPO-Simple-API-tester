import React from "react";
import { THEMES } from "#shared/constants";
import { X } from "lucide-react";
import EnvironmentManager from "./EnvironmentManager";

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
  onSetActiveEnvironment,
  onClearCookies,
  globalVariables,
  onGlobalChange,
}) => {
  const handleThemeChange = (event) => onChange({ theme: event.target.value });
  const handleTimeoutChange = (event) =>
    onChange({ timeout: Number(event.target.value) || settings.timeout });
  const handleCredentialsToggle = (event) =>
    onChange({ withCredentials: event.target.checked });
  const handleCertChange = (field, value) =>
    onChange({ certConfig: { ...settings.certConfig, [field]: value } });
  const handleSslToggle = (event) =>
    onChange({
      certConfig: {
        ...settings.certConfig,
        rejectUnauthorized: !event.target.checked,
      },
    });

  return (
    <div className={`settings-drawer ${open ? "open" : ""}`}>
      <div className="panel-header" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="section-title">Settings</div>
          <div className="muted">Stored locally on this device</div>
        </div>
        <button
          className="ghost"
          type="button"
          onClick={onClose}
          title="Close settings"
          style={{
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
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
        <div className="muted small">
          Applied to every request in this session.
        </div>
      </div>

      <div className="section">
        <label className="stacked">
          <span className="label">Send cookies</span>
          <div className="row compact">
            <input
              type="checkbox"
              checked={settings.withCredentials}
              onChange={handleCredentialsToggle}
            />
            <span className="muted">
              Include credentials/cookies when CORS permits.
            </span>
          </div>
        </label>
        <div className="muted small">Browser CORS rules still apply.</div>
        <button className="ghost" type="button" onClick={onClearCookies}>
          Clear cookie jar
        </button>
      </div>

      <div className="section">
        <div className="section-title">Certificates</div>
        <div className="muted small">Optional client certs (HTTPS only)</div>
        <label className="stacked">
          <span className="label">Client certificate path (.crt/.pem)</span>
          <input
            type="text"
            value={settings.certConfig?.clientCertPath || ""}
            onChange={(e) => handleCertChange("clientCertPath", e.target.value)}
            placeholder="/path/to/cert.pem"
          />
        </label>
        <label className="stacked">
          <span className="label">Client key path (.key)</span>
          <input
            type="text"
            value={settings.certConfig?.clientKeyPath || ""}
            onChange={(e) => handleCertChange("clientKeyPath", e.target.value)}
            placeholder="/path/to/key.pem"
          />
        </label>
        <label className="stacked">
          <span className="label">CA bundle path (optional)</span>
          <input
            type="text"
            value={settings.certConfig?.caPath || ""}
            onChange={(e) => handleCertChange("caPath", e.target.value)}
            placeholder="/path/to/ca.pem"
          />
        </label>
        <label className="stacked">
          <span className="label">Skip SSL verification</span>
          <div className="row compact">
            <input
              type="checkbox"
              checked={settings.certConfig?.rejectUnauthorized === false}
              onChange={handleSslToggle}
            />
            <span className="muted">
              Use only for self-signed development endpoints.
            </span>
          </div>
        </label>
      </div>

      <EnvironmentManager
        environments={environments}
        activeId={activeEnvironmentId}
        onAdd={onAddEnvironment}
        onUpdate={onUpdateEnvironment}
        onDelete={onDeleteEnvironment}
        onSetActive={onSetActiveEnvironment}
        globalVariables={globalVariables}
        onGlobalChange={onGlobalChange}
      />
    </div>
  );
};

export default SettingsPanel;
