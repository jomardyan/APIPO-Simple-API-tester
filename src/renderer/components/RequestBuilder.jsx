import React, { useEffect, useMemo, useState } from "react";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-markup"; // xml/html
import { HTTP_METHODS } from "#shared/constants";
import { randomId } from "../utils/id";

const SUPPORTED_METHODS = HTTP_METHODS;

const PROTOCOLS = [
  { label: "HTTP", value: "http" },
  { label: "GraphQL", value: "graphql" },
  { label: "WebSocket", value: "websocket" },
  { label: "Server-Sent Events", value: "sse" },
];

const RequestBuilder = ({ request, onSend, onCancel, isSending, settings }) => {
  const [protocol, setProtocol] = useState(request.protocol || "http");
  const [method, setMethod] = useState(request.method || "GET");
  const [url, setUrl] = useState(request.url || "");
  const [headers, setHeaders] = useState(request.headers || []);
  const [params, setParams] = useState(request.params || []);
  const [body, setBody] = useState(request.body || "");
  const [bodyMode, setBodyMode] = useState(request.bodyMode || "json");
  const [formData, setFormData] = useState(
    request.formData || [{ id: randomId(), key: "", value: "" }]
  );
  const [urlEncoded, setUrlEncoded] = useState(
    request.urlEncoded || [{ id: randomId(), key: "", value: "" }]
  );
  const [graphqlQuery, setGraphqlQuery] = useState(request.graphqlQuery || "");
  const [graphqlVariables, setGraphqlVariables] = useState(
    request.graphqlVariables || '{\n  "input": {}\n}'
  );
  const [auth, setAuth] = useState(request.auth || { type: "none" });
  const [preRequestScript, setPreRequestScript] = useState(
    request.preRequestScript || ""
  );
  const [testScript, setTestScript] = useState(request.testScript || "");

  useEffect(() => {
    setProtocol(request.protocol || "http");
    setMethod(request.method || "GET");
    setUrl(request.url || "");
    setHeaders(
      request.headers?.length
        ? request.headers
        : [{ id: randomId(), key: "", value: "" }]
    );
    setParams(
      request.params?.length
        ? request.params
        : [{ id: randomId(), key: "", value: "" }]
    );
    setBody(request.body || "");
    setBodyMode(request.bodyMode || "json");
    setFormData(
      request.formData?.length
        ? request.formData
        : [{ id: randomId(), key: "", value: "" }]
    );
    setUrlEncoded(
      request.urlEncoded?.length
        ? request.urlEncoded
        : [{ id: randomId(), key: "", value: "" }]
    );
    setGraphqlQuery(request.graphqlQuery || "");
    setGraphqlVariables(request.graphqlVariables || '{\n  "input": {}\n}');
    setAuth(request.auth || { type: "none" });
    setPreRequestScript(request.preRequestScript || "");
    setTestScript(request.testScript || "");
  }, [request]);

  const addHeaderRow = () => {
    setHeaders((prev) => [...prev, { id: randomId(), key: "", value: "" }]);
  };

  const updateHeaderRow = (id, field, value) => {
    setHeaders((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeHeaderRow = (id) => {
    setHeaders((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id)
    );
  };

  const addParamRow = () => {
    setParams((prev) => [...prev, { id: randomId(), key: "", value: "" }]);
  };

  const updateParamRow = (id, field, value) => {
    setParams((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeParamRow = (id) => {
    setParams((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id)
    );
  };

  const addFormRow = () => {
    setFormData((prev) => [...prev, { id: randomId(), key: "", value: "" }]);
  };

  const updateFormRow = (id, field, value) => {
    setFormData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeFormRow = (id) => {
    setFormData((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id)
    );
  };

  const addUrlEncodedRow = () => {
    setUrlEncoded((prev) => [...prev, { id: randomId(), key: "", value: "" }]);
  };

  const updateUrlEncodedRow = (id, field, value) => {
    setUrlEncoded((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const removeUrlEncodedRow = (id) => {
    setUrlEncoded((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id)
    );
  };

  const handleAuthChange = (field, value) => {
    setAuth((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSend({
      protocol,
      method,
      url: url.trim(),
      headers,
      params,
      bodyMode,
      formData,
      urlEncoded,
      graphqlQuery,
      graphqlVariables,
      body,
      auth,
      preRequestScript,
      testScript,
    });
  };

  const summary = useMemo(
    () =>
      `Timeout ${settings.timeout}ms · ${
        headers.filter((h) => h.key && h.value).length
      } headers · ${
        params.filter((p) => p.key && p.value).length
      } params · ${protocol.toUpperCase()}`,
    [headers, params, protocol, settings.timeout]
  );

  return (
    <section className="panel request-builder">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Request</p>
          <div className="muted">{summary} · Ctrl/Cmd+Enter to send</div>
        </div>
        <div className="row compact">
          <button
            type="button"
            className="ghost"
            disabled={!isSending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            disabled={!url || isSending}
            onClick={handleSubmit}
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>

      <form className="request-form" onSubmit={handleSubmit}>
        <div className="address-bar">
          <select
            value={protocol}
            onChange={(e) => setProtocol(e.target.value)}
            title="Protocol"
          >
            {PROTOCOLS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={protocol === "websocket" || protocol === "sse"}
            title="Method"
            style={{ color: "var(--text)", fontWeight: 600 }}
          >
            {SUPPORTED_METHODS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <input
            type="url"
            required
            placeholder="https://api.example.com/resource"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Auth</div>
              <div className="muted">
                Add bearer, API key, or basic credentials
              </div>
            </div>
          </div>
          <div className="auth-grid">
            <label className="stacked">
              <span className="label">Type</span>
              <select
                value={auth.type}
                onChange={(e) => handleAuthChange("type", e.target.value)}
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="apiKey">API Key</option>
                <option value="basic">Basic Auth</option>
                <option value="oauth2">OAuth 2.0</option>
              </select>
            </label>

            {(auth.type === "bearer" || auth.type === "oauth2") && (
              <label className="stacked grow">
                <span className="label">
                  {auth.type === "oauth2" ? "Access Token" : "Token"}
                </span>
                <input
                  type="text"
                  placeholder="ey..."
                  value={
                    auth.type === "oauth2"
                      ? auth.oauthToken || ""
                      : auth.token || ""
                  }
                  onChange={(e) =>
                    handleAuthChange(
                      auth.type === "oauth2" ? "oauthToken" : "token",
                      e.target.value
                    )
                  }
                />
              </label>
            )}

            {auth.type === "apiKey" && (
              <>
                <label className="stacked grow">
                  <span className="label">Key</span>
                  <input
                    type="text"
                    placeholder="X-API-Key"
                    value={auth.apiKeyKey || ""}
                    onChange={(e) =>
                      handleAuthChange("apiKeyKey", e.target.value)
                    }
                  />
                </label>
                <label className="stacked grow">
                  <span className="label">Value</span>
                  <input
                    type="text"
                    placeholder="secret"
                    value={auth.apiKeyValue || ""}
                    onChange={(e) =>
                      handleAuthChange("apiKeyValue", e.target.value)
                    }
                  />
                </label>
                <label className="stacked">
                  <span className="label">Add to</span>
                  <select
                    value={auth.apiKeyAddTo || "header"}
                    onChange={(e) =>
                      handleAuthChange("apiKeyAddTo", e.target.value)
                    }
                  >
                    <option value="header">Header</option>
                    <option value="query">Query Params</option>
                  </select>
                </label>
              </>
            )}

            {auth.type === "basic" && (
              <>
                <label className="stacked grow">
                  <span className="label">Username</span>
                  <input
                    type="text"
                    value={auth.username || ""}
                    onChange={(e) =>
                      handleAuthChange("username", e.target.value)
                    }
                  />
                </label>
                <label className="stacked grow">
                  <span className="label">Password</span>
                  <input
                    type="password"
                    value={auth.password || ""}
                    onChange={(e) =>
                      handleAuthChange("password", e.target.value)
                    }
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Query Params</div>
              <div className="muted">Append query parameters to the URL</div>
            </div>
            <button className="ghost" type="button" onClick={addParamRow}>
              Add param
            </button>
          </div>
          <div className="headers-grid">
            {params.map((row) => (
              <div key={row.id} className="header-row">
                <input
                  type="text"
                  placeholder="param"
                  value={row.key}
                  onChange={(e) =>
                    updateParamRow(row.id, "key", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="value"
                  value={row.value}
                  onChange={(e) =>
                    updateParamRow(row.id, "value", e.target.value)
                  }
                />
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => removeParamRow(row.id)}
                  title="Remove param"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <div>
              <div className="section-title">Headers</div>
              <div className="muted">Key-value pairs sent with the request</div>
            </div>
            <button className="ghost" type="button" onClick={addHeaderRow}>
              Add header
            </button>
          </div>
          <div className="headers-grid">
            {headers.map((row) => (
              <div key={row.id} className="header-row">
                <input
                  type="text"
                  placeholder="Header key"
                  value={row.key}
                  onChange={(e) =>
                    updateHeaderRow(row.id, "key", e.target.value)
                  }
                />
                <input
                  type="text"
                  placeholder="Header value"
                  value={row.value}
                  onChange={(e) =>
                    updateHeaderRow(row.id, "value", e.target.value)
                  }
                />
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => removeHeaderRow(row.id)}
                  title="Remove header"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {!["GET", "HEAD"].includes(method) && protocol === "http" && (
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">Body</div>
                <div className="muted">JSON/XML/raw or form-data supported</div>
              </div>
            </div>
            <div className="tab-header">
              <button
                className={`ghost ${bodyMode === "json" ? "active" : ""}`}
                type="button"
                onClick={() => setBodyMode("json")}
              >
                JSON
              </button>
              <button
                className={`ghost ${bodyMode === "xml" ? "active" : ""}`}
                type="button"
                onClick={() => setBodyMode("xml")}
              >
                XML
              </button>
              <button
                className={`ghost ${bodyMode === "raw" ? "active" : ""}`}
                type="button"
                onClick={() => setBodyMode("raw")}
              >
                Raw Text
              </button>
              <button
                className={`ghost ${bodyMode === "formData" ? "active" : ""}`}
                type="button"
                onClick={() => setBodyMode("formData")}
              >
                form-data
              </button>
              <button
                className={`ghost ${bodyMode === "urlencoded" ? "active" : ""}`}
                type="button"
                onClick={() => setBodyMode("urlencoded")}
              >
                x-www-form-urlencoded
              </button>
            </div>

            {bodyMode !== "formData" && (
              <div className="editor-container">
                <Editor
                  value={body}
                  onValueChange={setBody}
                  highlight={(code) =>
                    highlight(
                      code,
                      bodyMode === "json"
                        ? languages.json
                        : bodyMode === "xml"
                        ? languages.markup
                        : languages.clike
                    )
                  }
                  padding={10}
                  style={{
                    fontFamily:
                      '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace',
                    fontSize: 13,
                  }}
                  textareaClassName="code-editor-textarea"
                  placeholder={
                    bodyMode === "json"
                      ? '{\n  "message": "Hello API"\n}'
                      : bodyMode === "xml"
                      ? "<note><body>Hello</body></note>"
                      : "Plain text payload"
                  }
                />
              </div>
            )}

            {bodyMode === "formData" && (
              <div className="headers-grid">
                {formData.map((row) => (
                  <div key={row.id} className="header-row">
                    <input
                      type="text"
                      placeholder="field"
                      value={row.key}
                      onChange={(e) =>
                        updateFormRow(row.id, "key", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={row.value}
                      onChange={(e) =>
                        updateFormRow(row.id, "value", e.target.value)
                      }
                    />
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => removeFormRow(row.id)}
                      title="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="ghost" type="button" onClick={addFormRow}>
                  Add field
                </button>
              </div>
            )}

            {bodyMode === "urlencoded" && (
              <div className="headers-grid">
                {urlEncoded.map((row) => (
                  <div key={row.id} className="header-row">
                    <input
                      type="text"
                      placeholder="key"
                      value={row.key}
                      onChange={(e) =>
                        updateUrlEncodedRow(row.id, "key", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={row.value}
                      onChange={(e) =>
                        updateUrlEncodedRow(row.id, "value", e.target.value)
                      }
                    />
                    <button
                      className="icon-btn"
                      type="button"
                      onClick={() => removeUrlEncodedRow(row.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="ghost"
                  type="button"
                  onClick={addUrlEncodedRow}
                >
                  Add pair
                </button>
              </div>
            )}
          </div>
        )}

        {protocol === "graphql" && (
          <div className="section">
            <div className="section-header">
              <div>
                <div className="section-title">GraphQL</div>
                <div className="muted">Query and variables sent as JSON</div>
              </div>
            </div>
            <div className="section">
              <div className="section-title">Query</div>
              <div className="editor-container">
                <Editor
                  value={graphqlQuery}
                  onValueChange={setGraphqlQuery}
                  highlight={(code) => highlight(code, languages.json)}
                  padding={10}
                  style={{
                    fontFamily:
                      '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
            <div className="section">
              <div className="section-title">Variables</div>
              <div className="editor-container">
                <Editor
                  value={graphqlVariables}
                  onValueChange={setGraphqlVariables}
                  highlight={(code) => highlight(code, languages.json)}
                  padding={10}
                  style={{
                    fontFamily:
                      '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="section dual">
          <div className="section-block">
            <div className="section-header">
              <div>
                <div className="section-title">Pre-request Script</div>
                <div className="muted small">
                  Modify headers/query/body via `setHeader`, `setQuery`,
                  `setBody`.
                </div>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                value={preRequestScript}
                onValueChange={setPreRequestScript}
                highlight={(code) => highlight(code, languages.javascript)}
                padding={10}
                style={{
                  fontFamily:
                    '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace',
                  fontSize: 13,
                }}
              />
            </div>
          </div>
          <div className="section-block">
            <div className="section-header">
              <div>
                <div className="section-title">Tests / Assertions</div>
                <div className="muted small">
                  Use assert(condition, message)
                </div>
              </div>
            </div>
            <div className="editor-container">
              <Editor
                value={testScript}
                onValueChange={setTestScript}
                highlight={(code) => highlight(code, languages.javascript)}
                padding={10}
                style={{
                  fontFamily:
                    '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace',
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </section>
  );
};

export default RequestBuilder;
