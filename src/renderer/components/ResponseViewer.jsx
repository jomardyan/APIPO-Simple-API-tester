import React, { useEffect, useMemo, useState } from 'react';

const statusTone = (status) => {
  if (!status) return 'muted';
  if (status >= 200 && status < 300) return 'success';
  if (status >= 400 && status < 500) return 'warn';
  return 'danger';
};

const pretty = (data) => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
};

const ResponseViewer = ({ response }) => {
  const [tab, setTab] = useState('body');
  const [showRaw, setShowRaw] = useState(false);
  const body = useMemo(() => pretty(response?.data), [response]);
  const headerEntries = useMemo(
    () => (response?.headers ? Object.entries(response.headers) : []),
    [response]
  );
  const cookieEntries = useMemo(() => {
    const raw = response?.headers?.['set-cookie'] || response?.headers?.['Set-Cookie'];
    if (!raw) return [];
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((c, idx) => ({ id: `cookie-${idx}`, value: c }));
  }, [response]);

  const hasAssertions = Boolean(response?.assertions?.length);
  const hasHeaders = headerEntries.length > 0;
  const hasCookies = cookieEntries.length > 0;
  const hasEvents = Boolean(response?.events?.length);

  useEffect(() => {
    setTab('body');
    setShowRaw(false);
  }, [response]);

  useEffect(() => {
    setTab('body');
  }, [response]);

  const copyBody = async () => {
    if (!body) return;
    try {
      await navigator.clipboard?.writeText(body);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Copy failed', error);
    }
  };

  if (!response) {
    return (
      <section className="panel response-viewer">
        <div className="empty-state">
          <div className="brand-mark">→</div>
          <div>
            <div className="section-title">Awaiting response</div>
            <div className="muted">Send a request to see status, headers, and body.</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel response-viewer">
      <div className="panel-header">
        <div className="pill">Response</div>
        <div className={`pill ${statusTone(response.status)}`}>
          {response.status ? `${response.status} ${response.statusText}` : 'No status'}
        </div>
        <div className="muted">
          {response.duration ? `${response.duration} ms` : 'n/a'} ·{' '}
          {response.size ? `${response.size} chars` : 'size unknown'}
        </div>
      </div>

      <div className="response-metadata">
        <div>
          <div className="label">Duration</div>
          <div>{response.duration ? `${response.duration} ms` : '—'}</div>
        </div>
        <div>
          <div className="label">Status</div>
          <div>{response.status || 'No status'}</div>
        </div>
        <div>
          <div className="label">Error</div>
          <div className={response.error ? 'danger-text' : 'muted'}>
            {response.error || 'None'}
          </div>
        </div>
      </div>

      <div className="tab-header">
        <button
          className={`ghost ${tab === 'body' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('body')}
        >
          Body
        </button>
        <button
          className={`ghost ${tab === 'headers' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('headers')}
          disabled={!hasHeaders}
        >
          Headers ({headerEntries.length})
        </button>
        <button
          className={`ghost ${tab === 'cookies' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('cookies')}
          disabled={!hasCookies}
        >
          Cookies ({cookieEntries.length})
        </button>
        <button
          className={`ghost ${tab === 'assertions' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('assertions')}
          disabled={!hasAssertions}
        >
          Assertions ({response.assertions?.length || 0})
        </button>
        <button
          className={`ghost ${tab === 'events' ? 'active' : ''}`}
          type="button"
          onClick={() => setTab('events')}
          disabled={!hasEvents}
        >
          Events ({response.events?.length || 0})
        </button>
      </div>

      {tab === 'body' && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Body</div>
            <div className="muted">Formatted for JSON and text payloads</div>
          </div>
          <div className="section-header">
            <div className="pill">Size: {response.size || 0} chars</div>
            <div className="row compact">
              <button className="ghost" type="button" onClick={copyBody} disabled={!body}>
                Copy body
              </button>
              <button
                className={`ghost ${showRaw ? 'active' : ''}`}
                type="button"
                onClick={() => setShowRaw((v) => !v)}
              >
                {showRaw ? 'Formatted' : 'Raw'}
              </button>
            </div>
          </div>
          <pre className="code-block">
            {showRaw && typeof response.data !== 'string'
              ? String(response.data)
              : body || 'No body returned'}
          </pre>
        </div>
      )}

      {tab === 'headers' && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Headers</div>
            <div className="muted small">Response headers from the server</div>
          </div>
          <div className="headers-grid">
            {headerEntries.map(([key, value]) => (
              <div key={key} className="header-row">
                <input type="text" value={key} readOnly />
                <input type="text" value={String(value)} readOnly />
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(`${key}: ${value}`)}
                  title="Copy header"
                >
                  ⧉
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'assertions' && response.assertions && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Assertions</div>
          </div>
          <div className="history-list">
            {response.assertions.map((assertion) => (
              <div
                key={assertion.id}
                className={`history-item ${assertion.ok ? '' : 'failed-assertion'}`}
              >
                <div className={`pill ${assertion.ok ? 'success' : 'danger'}`}>
                  {assertion.ok ? 'Pass' : 'Fail'}
                </div>
                <div className="history-meta">
                  <div className="history-url">{assertion.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cookies' && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Cookies</div>
            <div className="muted small">Set-Cookie headers returned from the server</div>
          </div>
          <div className="history-list">
            {cookieEntries.map((cookie) => (
              <div key={cookie.id} className="history-item">
                <div className="history-meta">
                  <div className="history-url">{cookie.value}</div>
                </div>
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(cookie.value)}
                  title="Copy cookie"
                >
                  ⧉
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'events' && (
        <div className="section">
          <div className="section-header">
            <div className="section-title">Events</div>
            <div className="muted small">WebSocket / SSE event stream</div>
          </div>
          <div className="history-list">
            {(response.events || []).map((evt) => (
              <div key={evt.id} className="history-item">
                <div className="pill">{evt.type || 'event'}</div>
                <div className="history-meta">
                  <div className="history-url">{evt.data || 'empty'}</div>
                  <div className="muted small">{new Date(evt.time || Date.now()).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ResponseViewer;
