import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import RequestBuilder from './components/RequestBuilder';
import ResponseViewer from './components/ResponseViewer';
import SettingsPanel from './components/SettingsPanel';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import ConsolePanel from './components/ConsolePanel';
import { DEFAULT_REQUEST, THEMES } from '#shared/constants';
import { useAppStore } from './store/useAppStore';
import { randomId } from './utils/id';

const createRequestDraft = () => ({
  ...DEFAULT_REQUEST,
  headers: [{ id: randomId(), key: '', value: '' }],
  params: [{ id: randomId(), key: '', value: '' }],
  auth: { ...DEFAULT_REQUEST.auth }
});

const parseHeaders = (rows = []) =>
  rows.reduce((acc, row) => {
    if (row.key && row.value) {
      acc[row.key] = row.value;
    }
    return acc;
  }, {});

const parseParams = (rows = []) => rows.filter((row) => row.key && row.value);

const prettifyData = (payload) => {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch (err) {
    return String(payload);
  }
};

const cloneRequest = (request) => JSON.parse(JSON.stringify(request));

const applyTheme = (theme) => {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  document.documentElement.dataset.theme = resolved;
};

const toEnvMap = (env) =>
  (env?.variables || []).reduce((acc, variable) => {
    if (variable.key) acc[variable.key] = variable.value;
    return acc;
  }, {});

const substituteTemplate = (value, envMap) => {
  if (!value || typeof value !== 'string') return value;
  return value.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) =>
    Object.prototype.hasOwnProperty.call(envMap, key) ? envMap[key] : `{{${key}}}`
  );
};

const App = () => {
  const {
    history,
    addHistory,
    clearHistory,
    settings,
    updateSettings,
    environments,
    activeEnvironmentId,
    setActiveEnvironment
  } = useAppStore();
  const [requestDraft, setRequestDraft] = useState(createRequestDraft());
  const [responseState, setResponseState] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState('');
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    applyTheme(settings.theme);
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    const listener = () => settings.theme === 'system' && applyTheme('system');
    media?.addEventListener('change', listener);
    return () => media?.removeEventListener('change', listener);
  }, [settings.theme]);

  useEffect(() => {
    if (window.quickApi?.version) {
      window.quickApi.version().then((ver) => setAppVersion(ver));
    }
  }, []);

  const activeEnv = useMemo(
    () => environments.find((env) => env.id === activeEnvironmentId),
    [activeEnvironmentId, environments]
  );

  const envMap = useMemo(() => toEnvMap(activeEnv), [activeEnv]);

  const resolveDraftWithEnv = (draft) => {
    const resolved = cloneRequest(draft);
    resolved.url = substituteTemplate(resolved.url, envMap);
    resolved.headers = resolved.headers.map((h) => ({
      ...h,
      key: substituteTemplate(h.key, envMap),
      value: substituteTemplate(h.value, envMap)
    }));
    resolved.params = resolved.params.map((p) => ({
      ...p,
      key: substituteTemplate(p.key, envMap),
      value: substituteTemplate(p.value, envMap)
    }));
    if (typeof resolved.body === 'string') {
      resolved.body = substituteTemplate(resolved.body, envMap);
    }
    return resolved;
  };


  const addLog = (type, message) =>
    setLogs((prev) => [{ id: randomId(), type, message, timestamp: Date.now() }, ...prev].slice(0, 200));

  const httpClient = useMemo(() => {
    const client = axios.create();
    client.interceptors.request.use((config) => {
      addLog('REQ', `${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });
    client.interceptors.response.use(
      (res) => {
        addLog('RES', `${res.status} ${res.config.url}`);
        return res;
      },
      (error) => {
        addLog('ERR', `${error.message} ${error.config?.url || ''}`);
        return Promise.reject(error);
      }
    );
    return client;
  }, []);

  const buildUrlWithParams = (baseUrl, params) => {
    if (!params?.length) return baseUrl;
    try {
      const url = new URL(baseUrl);
      params.forEach((p) => url.searchParams.append(p.key, p.value));
      return url.toString();
    } catch (error) {
      const qs = params.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`);
      const joiner = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${joiner}${qs.join('&')}`;
    }
  };

  const runPreRequestScript = (script, base) => {
    if (!script?.trim()) return base;
    const working = {
      headers: { ...base.headers },
      params: [...base.params],
      body: base.body,
      formData: base.formData ? [...base.formData] : []
    };
    const ctx = {
      env: envMap,
      headers: working.headers,
      params: working.params,
      body: working.body,
      setHeader: (key, value) => {
        if (!key) return;
        working.headers[key] = value;
      },
      setQuery: (key, value) => {
        if (!key) return;
        working.params.push({ key, value });
      },
      setBody: (next) => {
        working.body = next;
      },
      setFormField: (key, value) => {
        working.formData.push({ key, value });
      },
      log: (...args) => console.log('[PreRequest]', ...args)
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('ctx', script);
      fn(ctx);
    } catch (error) {
      console.error('Pre-request script error', error);
    }

    return working;
  };

  const runAssertions = (script, response) => {
    if (!script?.trim()) return [];
    const assertions = [];
    const assert = (condition, message) =>
      assertions.push({ id: randomId(), ok: !!condition, message: message || 'Assertion' });

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('ctx', script);
      fn({ response, assert, env: envMap });
    } catch (error) {
      assertions.push({ id: randomId(), ok: false, message: error.message });
    }
    return assertions;
  };

  const withAuth = (draftHeaders, draftParams, auth) => {
    const headers = { ...draftHeaders };
    let params = [...draftParams];
    switch (auth?.type) {
      case 'bearer':
        if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
        break;
      case 'oauth2':
        if (auth.oauthToken) headers.Authorization = `Bearer ${auth.oauthToken}`;
        break;
      case 'basic': {
        if (typeof btoa !== 'undefined') {
          const encoded = btoa(`${auth.username || ''}:${auth.password || ''}`);
          headers.Authorization = `Basic ${encoded}`;
        }
        break;
      }
      case 'apiKey':
        if (auth.apiKeyKey && auth.apiKeyValue) {
          if (auth.apiKeyAddTo === 'query') {
            params = [...params, { key: auth.apiKeyKey, value: auth.apiKeyValue }];
          } else {
            headers[auth.apiKeyKey] = auth.apiKeyValue;
          }
        }
        break;
      default:
        break;
    }
    return { headers, params };
  };

  const sendRequest = async (
    draft,
    { setResponse = true, storeHistory = true, signal } = {}
  ) => {
    const resolvedDraft = resolveDraftWithEnv(draft);
    const started = performance.now();
    const headerMap = parseHeaders(resolvedDraft.headers);
    const paramList = parseParams(resolvedDraft.params);
    const { headers, params } = withAuth(headerMap, paramList, resolvedDraft.auth);
    const scripted = runPreRequestScript(resolvedDraft.preRequestScript, {
      headers,
      params,
      body: resolvedDraft.body,
      formData: resolvedDraft.formData
    });
    const targetUrl = buildUrlWithParams(resolvedDraft.url, scripted.params);
    let data = undefined;
    if (!['GET', 'HEAD'].includes(resolvedDraft.method)) {
      if (resolvedDraft.bodyMode === 'formData') {
        const fd = new FormData();
        scripted.formData?.forEach?.((row) => row.key && fd.append(row.key, row.value));
        data = fd;
      } else {
        const bodyInput =
          typeof scripted.body === 'string'
            ? scripted.body.trim()
            : scripted.body === undefined
            ? ''
            : scripted.body;
        if (bodyInput !== '' && bodyInput !== undefined) {
          if (resolvedDraft.bodyMode === 'json') {
            try {
              data = JSON.parse(bodyInput);
            } catch (error) {
              data = bodyInput;
            }
          } else {
            data = bodyInput;
          }
        }
      }
    }

    let response;
    try {
      const res = await httpClient({
        method: resolvedDraft.method,
        url: targetUrl,
        headers: scripted.headers,
        data,
        timeout: settings.timeout,
        signal
      });

      const duration = Math.round(performance.now() - started);
      response = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        duration,
        error: null,
        size: prettifyData(res.data).length,
        assertions: runAssertions(resolvedDraft.testScript, res)
      };
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
        return { aborted: true };
      }

      const duration = Math.round(performance.now() - started);
      const res = error?.response;
      response = {
        status: res?.status ?? null,
        statusText: res?.statusText ?? 'Request Failed',
        data: res?.data ?? error.message,
        headers: res?.headers ?? {},
        duration,
        error: error.message,
        size: prettifyData(res?.data ?? error.message).length,
        assertions: runAssertions(resolvedDraft.testScript, res || error)
      };
    }

    if (!response) {
      return { aborted: true };
    }

    if (setResponse) {
      setResponseState(response);
    }

    if (storeHistory) {
      addHistory({
        id: randomId(),
        timestamp: Date.now(),
        request: cloneRequest(draft),
        response
      });
    }

    return response;
  };

  const handleSend = async (draft) => {
    if (!draft.url || isSending) return;
    const controller = new AbortController();
    setAbortController(controller);
    setIsSending(true);
    setRequestDraft(draft);
    const result = await sendRequest(draft, {
      setResponse: true,
      storeHistory: true,
      signal: controller.signal
    });
    if (result?.aborted) {
      setResponseState({
        status: null,
        statusText: 'Cancelled',
        data: 'Request cancelled',
        headers: {},
        duration: 0,
        error: 'Cancelled',
        size: 0,
        assertions: []
      });
    }
    setIsSending(false);
    setAbortController(null);
  };

  const handleCancel = () => {
    abortController?.abort();
    setAbortController(null);
    setIsSending(false);
  };

  const handleHistorySelect = (entry) => {
    setRequestDraft(cloneRequest(entry.request));
    setResponseState(entry.response);
  };

  const handleCollectionSelect = (entry) => {
    setRequestDraft(cloneRequest(entry.request));
    setResponseState(null);
  };

  const handleBulkAddCurrent = () => {
    setBulkQueue((prev) => [
      ...prev,
      {
        id: randomId(),
        request: cloneRequest(requestDraft)
      }
    ]);
  };

  const handleBulkRemove = (id) => {
    setBulkQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleBulkClear = () => {
    setBulkQueue([]);
    setBulkResults([]);
  };

  const handleBulkRun = async () => {
    if (!bulkQueue.length) return;
    setIsBulkRunning(true);
    const results = [];
    for (const item of bulkQueue) {
      const response = await sendRequest(item.request, { setResponse: false, storeHistory: true });
      results.push({ ...item, response });
    }
    setBulkResults(results);
    setIsBulkRunning(false);
  };

  const handleClearLogs = () => setLogs([]);

  useEffect(() => {
    const unsubscribe = window.quickApi?.onAppEvent?.((event) => {
      if (event === 'send-request' && !isSending) {
        handleSend(requestDraft);
      }
      if (event === 'add-to-bulk') {
        handleBulkAddCurrent();
      }
    });

    return () => unsubscribe?.();
  }, [requestDraft, isSending]);

  useEffect(() => {
    const handleKey = (event) => {
      const isCmd = event.metaKey || event.ctrlKey;
      if (!isCmd || showSettings) return;

      if (event.key === 'Enter') {
        event.preventDefault();
        if (!isSending) {
          handleSend(requestDraft);
        }
      }

      if (event.shiftKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        handleBulkAddCurrent();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [requestDraft, isSending, showSettings]);

  const handleResetRequest = () => {
    setRequestDraft(createRequestDraft());
    setResponseState(null);
  };

  const themeLabel = useMemo(() => {
    const current = settings.theme;
    if (THEMES.includes(current)) return current;
    return 'system';
  }, [settings.theme]);

  return (
    <div className="app-shell">
      <TopBar
        version={appVersion}
        theme={themeLabel}
        onToggleSettings={() => setShowSettings(true)}
        onNewRequest={handleResetRequest}
        environments={environments}
        activeEnvironmentId={activeEnvironmentId}
        onEnvironmentChange={setActiveEnvironment}
      />
      <div className="main-layout">
        <Sidebar
          history={history}
          onHistorySelect={handleHistorySelect}
          onHistoryClear={clearHistory}
          requestDraft={requestDraft}
          onLoadRequestFromCollection={handleCollectionSelect}
          bulkQueue={bulkQueue}
          bulkResults={bulkResults}
          onBulkAddCurrent={handleBulkAddCurrent}
          onBulkRun={handleBulkRun}
          onBulkClear={handleBulkClear}
          onBulkRemove={handleBulkRemove}
          isBulkRunning={isBulkRunning}
        />
        <div className="workspace">
          <RequestBuilder
            request={requestDraft}
            isSending={isSending}
            onSend={handleSend}
            onCancel={handleCancel}
            settings={settings}
          />
          <ResponseViewer response={responseState} />
          <ConsolePanel logs={logs} onClear={handleClearLogs} />
        </div>
      </div>
      <SettingsPanel
        open={showSettings}
        settings={settings}
        onClose={() => setShowSettings(false)}
        onChange={updateSettings}
        environments={environments}
        activeEnvironmentId={activeEnvironmentId}
        onAddEnvironment={(name) => useAppStore.getState().addEnvironment(name)}
        onUpdateEnvironment={(id, patch) => useAppStore.getState().updateEnvironment(id, patch)}
        onDeleteEnvironment={(id) => useAppStore.getState().deleteEnvironment(id)}
        onSetActiveEnvironment={setActiveEnvironment}
      />
    </div>
  );
};

export default App;
