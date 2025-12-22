import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Panel, Group, Separator } from "react-resizable-panels";
import RequestBuilder from "./components/RequestBuilder";
import ResponseViewer from "./components/ResponseViewer";
import SettingsPanel from "./components/SettingsPanel";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import { DEFAULT_REQUEST, THEMES } from "#shared/constants";
import { useAppStore } from "./store/useAppStore";
import {
  buildCookieHeader,
  buildUrlWithParams,
  cloneRequest,
  hostnameFromUrl,
  parseHeaders,
  parseParams,
  parseSetCookies,
  prettifyData,
  runAssertions,
  runPreRequestScript,
  substituteTemplate,
  toEnvMap,
  withAuth,
} from "./utils/request";
import { randomId } from "./utils/id";

const createRequestDraft = () => ({
  ...DEFAULT_REQUEST,
  url: "https://jsonplaceholder.typicode.com/posts/1",
  method: "GET",
  headers: [
    { id: randomId(), key: "Accept", value: "application/json" },
    { id: randomId(), key: "", value: "" },
  ],
  params: [{ id: randomId(), key: "", value: "" }],
  urlEncoded: [{ id: randomId(), key: "", value: "" }],
  auth: { ...DEFAULT_REQUEST.auth },
});

const applyTheme = (theme) => {
  const prefersDark = window.matchMedia?.(
    "(prefers-color-scheme: dark)"
  ).matches;
  const resolved =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = resolved;
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
    setActiveEnvironment,
    cookieJar,
    upsertCookies,
    clearCookies: resetCookieJar,
    globalVariables,
    setGlobalVariables,
  } = useAppStore();
  const [requestDraft, setRequestDraft] = useState(createRequestDraft());
  const [responseState, setResponseState] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [bulkQueue, setBulkQueue] = useState([]);
  const [bulkResults, setBulkResults] = useState([]);
  const [isBulkRunning, setIsBulkRunning] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [runtimeIssue, setRuntimeIssue] = useState(null);
  const topBarRef = React.useRef(null);

  // Dynamically calculate settings drawer positioning
  useEffect(() => {
    const updateSettingsPosition = () => {
      const topBar = topBarRef.current;
      if (topBar) {
        const topBarHeight = topBar.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const drawerWidth = Math.min(420, windowWidth * 0.4);
        const leftPosition = windowWidth - drawerWidth;
        const topOffset = topBarHeight + 8; // 8px padding below top bar
        const maxHeight = windowHeight - topOffset - 16;

        document.documentElement.style.setProperty(
          "--settings-top",
          `${topOffset}px`
        );
        document.documentElement.style.setProperty(
          "--settings-width",
          `${drawerWidth}px`
        );
        document.documentElement.style.setProperty(
          "--settings-left",
          `${leftPosition}px`
        );
        document.documentElement.style.setProperty(
          "--settings-max-height",
          `${maxHeight}px`
        );
      }
    };

    updateSettingsPosition();
    window.addEventListener("resize", updateSettingsPosition);
    return () => window.removeEventListener("resize", updateSettingsPosition);
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const listener = () => settings.theme === "system" && applyTheme("system");
    media?.addEventListener("change", listener);
    return () => media?.removeEventListener("change", listener);
  }, [settings.theme]);

  useEffect(() => {
    if (window.quickApi?.version) {
      window.quickApi.version().then((ver) => setAppVersion(ver));
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsBooting(false), 720);
    return () => clearTimeout(timer);
  }, []);

  const activeEnv = useMemo(
    () => environments.find((env) => env.id === activeEnvironmentId),
    [activeEnvironmentId, environments]
  );

  const envMap = useMemo(() => toEnvMap(activeEnv), [activeEnv]);
  const globalMap = useMemo(
    () =>
      (globalVariables || []).reduce((acc, variable) => {
        if (variable.key) acc[variable.key] = variable.value;
        return acc;
      }, {}),
    [globalVariables]
  );

  const mergedMap = useMemo(
    () => ({ ...globalMap, ...envMap }),
    [globalMap, envMap]
  );

  const resolveDraftWithEnv = (draft) => {
    const resolved = cloneRequest(draft);
    resolved.url = substituteTemplate(resolved.url, mergedMap);
    resolved.headers = resolved.headers.map((h) => ({
      ...h,
      key: substituteTemplate(h.key, mergedMap),
      value: substituteTemplate(h.value, mergedMap),
    }));
    resolved.params = resolved.params.map((p) => ({
      ...p,
      key: substituteTemplate(p.key, mergedMap),
      value: substituteTemplate(p.value, mergedMap),
    }));
    if (typeof resolved.body === "string") {
      resolved.body = substituteTemplate(resolved.body, mergedMap);
    }
    resolved.urlEncoded = (resolved.urlEncoded || []).map((p) => ({
      ...p,
      key: substituteTemplate(p.key, mergedMap),
      value: substituteTemplate(p.value, mergedMap),
    }));
    resolved.graphqlQuery = substituteTemplate(
      resolved.graphqlQuery,
      mergedMap
    );
    resolved.graphqlVariables = substituteTemplate(
      resolved.graphqlVariables,
      mergedMap
    );
    return resolved;
  };
  const notifyRuntimeIssue = (message) => {
    if (!message) return;
    setRuntimeIssue({ id: randomId(), message, at: Date.now() });
  };

  const httpClient = useMemo(() => {
    const client = axios.create();
    return client;
  }, []);

  const sendHttp = async (
    resolvedDraft,
    { setResponse = true, storeHistory = true, signal } = {}
  ) => {
    const started = performance.now();
    const headerMap = parseHeaders(resolvedDraft.headers);
    const paramList = parseParams(resolvedDraft.params);
    const { headers, params } = withAuth(
      headerMap,
      paramList,
      resolvedDraft.auth
    );
    const scripted = runPreRequestScript(
      resolvedDraft.preRequestScript,
      {
        headers,
        params,
        body: resolvedDraft.body,
        formData: resolvedDraft.formData,
      },
      envMap
    );
    const targetUrl = buildUrlWithParams(resolvedDraft.url, scripted.params);
    const host = hostnameFromUrl(targetUrl);
    const cookieHeader = buildCookieHeader(host, cookieJar);
    if (settings.withCredentials && cookieHeader && !scripted.headers.Cookie) {
      scripted.headers.Cookie = cookieHeader;
    }

    let data = undefined;
    let methodToUse = resolvedDraft.method;

    if (resolvedDraft.protocol === "graphql") {
      methodToUse = "POST";
      scripted.headers["Content-Type"] = "application/json";
      try {
        const variables = JSON.parse(resolvedDraft.graphqlVariables || "{}");
        data = { query: resolvedDraft.graphqlQuery, variables };
      } catch (error) {
        data = {
          query: resolvedDraft.graphqlQuery,
          variables: resolvedDraft.graphqlVariables,
        };
      }
    } else if (!["GET", "HEAD"].includes(resolvedDraft.method)) {
      if (resolvedDraft.bodyMode === "formData") {
        const fd = new FormData();
        scripted.formData?.forEach?.(
          (row) => row.key && fd.append(row.key, row.value)
        );
        data = fd;
      } else if (resolvedDraft.bodyMode === "urlencoded") {
        const paramsBody = new URLSearchParams();
        (resolvedDraft.urlEncoded || []).forEach(
          (row) => row.key && paramsBody.append(row.key, row.value)
        );
        data = paramsBody;
        scripted.headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        const bodyInput =
          typeof scripted.body === "string"
            ? scripted.body.trim()
            : scripted.body === undefined
            ? ""
            : scripted.body;
        if (bodyInput !== "" && bodyInput !== undefined) {
          if (resolvedDraft.bodyMode === "json") {
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
      const runViaMain = async () =>
        window.quickApi?.sendRequest?.({
          url: targetUrl,
          method: methodToUse,
          headers: scripted.headers,
          data,
          timeout: settings.timeout,
          certConfig: settings.certConfig,
          withCredentials: settings.withCredentials,
        });

      const res =
        (await runViaMain()) ??
        (await httpClient({
          method: methodToUse,
          url: targetUrl,
          headers: scripted.headers,
          data,
          timeout: settings.timeout,
          signal,
          withCredentials: settings.withCredentials,
        }));

      const duration = Math.round(performance.now() - started);
      response = {
        status: res.status,
        statusText: res.statusText,
        data: res.data,
        headers: res.headers,
        duration,
        error: res.error || null,
        size: prettifyData(res.data).length,
        assertions: runAssertions(resolvedDraft.testScript, res, envMap),
      };

      const setCookieHeader =
        res.headers?.["set-cookie"] || res.headers?.["Set-Cookie"];
      if (settings.withCredentials && setCookieHeader && host) {
        upsertCookies(host, parseSetCookies(setCookieHeader));
      }
    } catch (error) {
      if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
        return { aborted: true };
      }

      const duration = Math.round(performance.now() - started);
      const res = error?.response;
      response = {
        status: res?.status ?? null,
        statusText: res?.statusText ?? "Request Failed",
        data: res?.data ?? error.message,
        headers: res?.headers ?? {},
        duration,
        error: error.message,
        size: prettifyData(res?.data ?? error.message).length,
        assertions: runAssertions(
          resolvedDraft.testScript,
          res || error,
          envMap
        ),
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
        request: cloneRequest(resolvedDraft),
        response,
        environmentId: activeEnvironmentId,
        environmentName: activeEnv?.name,
        protocol: resolvedDraft.protocol,
      });
    }

    return response;
  };

  const sendSse = (
    resolvedDraft,
    { setResponse = true, storeHistory = true } = {}
  ) =>
    new Promise((resolve) => {
      const events = [];
      const started = performance.now();
      let settled = false;
      try {
        const source = new EventSource(resolvedDraft.url);
        const finish = (payload) => {
          if (settled) return;
          settled = true;
          source.close();
          const response = {
            status: null,
            statusText: "SSE stream",
            data: "Event stream",
            headers: {},
            duration: Math.round(performance.now() - started),
            error: payload?.error || null,
            size: JSON.stringify(events).length,
            assertions: runAssertions(
              resolvedDraft.testScript,
              payload,
              envMap
            ),
            events,
          };
          if (setResponse) setResponseState(response);
          if (storeHistory) {
            addHistory({
              id: randomId(),
              timestamp: Date.now(),
              request: cloneRequest(resolvedDraft),
              response,
            });
          }
          resolve(response);
        };

        const timer = setTimeout(() => finish(), 6000);
        source.onmessage = (event) => {
          events.push({
            id: randomId(),
            type: event.type || "message",
            data: event.data,
            time: Date.now(),
          });
          if (events.length >= 8) {
            clearTimeout(timer);
            finish();
          }
        };
        source.onerror = () => {
          clearTimeout(timer);
          finish({ error: "SSE error" });
        };
      } catch (error) {
        const response = {
          status: null,
          statusText: "SSE error",
          data: error.message,
          headers: {},
          duration: Math.round(performance.now() - started),
          error: error.message,
          size: 0,
          assertions: runAssertions(resolvedDraft.testScript, error, envMap),
          events,
        };
        if (setResponse) setResponseState(response);
        if (storeHistory)
          addHistory({
            id: randomId(),
            timestamp: Date.now(),
            request: cloneRequest(resolvedDraft),
            response,
          });
        resolve(response);
      }
    });

  const sendWebSocket = (
    resolvedDraft,
    { setResponse = true, storeHistory = true } = {}
  ) =>
    new Promise((resolve) => {
      const started = performance.now();
      const events = [];
      try {
        const ws = new WebSocket(resolvedDraft.url);
        const finish = (payload) => {
          const response = {
            status: null,
            statusText: "WebSocket",
            data: "WebSocket session",
            headers: {},
            duration: Math.round(performance.now() - started),
            error: payload?.error || null,
            size: JSON.stringify(events).length,
            assertions: runAssertions(
              resolvedDraft.testScript,
              payload,
              envMap
            ),
            events,
          };
          if (setResponse) setResponseState(response);
          if (storeHistory)
            addHistory({
              id: randomId(),
              timestamp: Date.now(),
              request: cloneRequest(resolvedDraft),
              response,
            });
          resolve(response);
        };

        const timer = setTimeout(() => {
          ws.close();
          finish();
        }, 6000);

        ws.onmessage = (event) => {
          events.push({
            id: randomId(),
            type: "message",
            data: event.data,
            time: Date.now(),
          });
        };

        ws.onerror = (event) => {
          clearTimeout(timer);
          finish({ error: event?.message || "WebSocket error" });
        };

        ws.onclose = () => {
          clearTimeout(timer);
          finish();
        };
      } catch (error) {
        const response = {
          status: null,
          statusText: "WebSocket error",
          data: error.message,
          headers: {},
          duration: Math.round(performance.now() - started),
          error: error.message,
          size: 0,
          assertions: runAssertions(resolvedDraft.testScript, error, envMap),
          events,
        };
        if (setResponse) setResponseState(response);
        if (storeHistory)
          addHistory({
            id: randomId(),
            timestamp: Date.now(),
            request: cloneRequest(resolvedDraft),
            response,
          });
        resolve(response);
      }
    });

  const sendRequest = async (draft, options = {}) => {
    const resolvedDraft = resolveDraftWithEnv(draft);
    if (resolvedDraft.protocol === "websocket") {
      return sendWebSocket(resolvedDraft, options);
    }
    if (resolvedDraft.protocol === "sse") {
      return sendSse(resolvedDraft, options);
    }
    return sendHttp(resolvedDraft, options);
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
      signal: controller.signal,
    });
    if (result?.aborted) {
      setResponseState({
        status: null,
        statusText: "Cancelled",
        data: "Request cancelled",
        headers: {},
        duration: 0,
        error: "Cancelled",
        size: 0,
        assertions: [],
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
        request: cloneRequest(requestDraft),
      },
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
      const response = await sendRequest(item.request, {
        setResponse: false,
        storeHistory: true,
      });
      results.push({ ...item, response });
    }
    setBulkResults(results);
    setIsBulkRunning(false);
  };

  const handleClearCookies = async () => {
    resetCookieJar();
    try {
      if (typeof window !== "undefined" && window.quickApi?.clearCookies) {
        await window.quickApi.clearCookies();
      }
    } catch (_error) {
      // Handle error silently
    }
  };

  useEffect(() => {
    const unsubscribe = window.quickApi?.onAppEvent?.((event) => {
      if (event === "send-request" && !isSending) {
        handleSend(requestDraft);
      }
      if (event === "add-to-bulk") {
        handleBulkAddCurrent();
      }
      if (event === "new-request") {
        handleResetRequest();
      }
      if (event === "open-settings") {
        setShowSettings(true);
      }
    });

    return () => unsubscribe?.();
  }, [requestDraft, isSending]);

  useEffect(() => {
    const handleKey = (event) => {
      const isCmd = event.metaKey || event.ctrlKey;
      if (!isCmd) return;

      if (event.key === "Enter") {
        event.preventDefault();
        if (!isSending && !showSettings) {
          handleSend(requestDraft);
        }
      }

      if (event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (!showSettings) {
          handleBulkAddCurrent();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [requestDraft, isSending, showSettings]);

  useEffect(() => {
    const off = window.quickApi?.onAppError?.((message) =>
      notifyRuntimeIssue(message || "Unexpected app error")
    );
    const handleError = (event) =>
      notifyRuntimeIssue(event?.message || "Renderer error");
    const handleRejection = (event) =>
      notifyRuntimeIssue(
        event?.reason?.message || event?.reason || "Unhandled promise rejection"
      );

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      off?.();
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  const handleResetRequest = () => {
    setRequestDraft(createRequestDraft());
    setResponseState(null);
  };

  const themeLabel = useMemo(() => {
    const current = settings.theme;
    if (THEMES.includes(current)) return current;
    return "system";
  }, [settings.theme]);

  return (
    <>
      <div className={`splash-screen ${isBooting ? "visible" : "hidden"}`}>
        <div className="splash-card">
          <div className="splash-mark">QA</div>
          <div className="splash-body">
            <div className="splash-title">Quick API Client</div>
            <div className="splash-subtitle">Warming up workbench…</div>
            <div className="splash-progress">
              <span className="bar" />
            </div>
          </div>
        </div>
      </div>

      <div className="app-shell">
        {showSettings && (
          <div
            className="settings-overlay"
            onClick={() => setShowSettings(false)}
          />
        )}

        {runtimeIssue ? (
          <div className="runtime-banner">
            <div>
              <strong>Runtime issue:</strong> {runtimeIssue.message}
            </div>
            <button className="ghost" onClick={() => setRuntimeIssue(null)}>
              Dismiss
            </button>
          </div>
        ) : null}

        <TopBar
          ref={topBarRef}
          version={appVersion}
          theme={themeLabel}
          onToggleSettings={() => setShowSettings(true)}
          onNewRequest={handleResetRequest}
          environments={environments}
          activeEnvironmentId={activeEnvironmentId}
          onEnvironmentChange={setActiveEnvironment}
        />
        <div className="main-layout">
          <Group
            direction="horizontal"
            className="panels-group"
            storage={null}
            style={{ width: "100%", height: "100%" }}
          >
            <Panel
              id="sidebar-panel"
              defaultSize={20}
              minSize={20}
              maxSize={50}
              collapsible={false}
              className="sidebar-panel"
              order={1}
            >
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
            </Panel>
            <Separator className="resize-handle-v" />
            <Panel id="workspace-panel">
              <div className="workspace" style={{ position: "relative" }}>
                <Group direction="vertical">
                  <Panel defaultSize={50} minSize={20}>
                    <RequestBuilder
                      request={requestDraft}
                      isSending={isSending}
                      onSend={handleSend}
                      onCancel={handleCancel}
                      settings={settings}
                    />
                  </Panel>
                  <Separator className="resize-handle-h" />
                  <Panel defaultSize={50} minSize={20}>
                    <ResponseViewer response={responseState} />
                  </Panel>
                </Group>
              </div>
            </Panel>
          </Group>
        </div>
        <SettingsPanel
          open={showSettings}
          settings={settings}
          onClose={() => setShowSettings(false)}
          onChange={updateSettings}
          environments={environments}
          activeEnvironmentId={activeEnvironmentId}
          onAddEnvironment={(name) =>
            useAppStore.getState().addEnvironment(name)
          }
          onUpdateEnvironment={(id, patch) =>
            useAppStore.getState().updateEnvironment(id, patch)
          }
          onDeleteEnvironment={(id) =>
            useAppStore.getState().deleteEnvironment(id)
          }
          onSetActiveEnvironment={setActiveEnvironment}
          onClearCookies={handleClearCookies}
          globalVariables={globalVariables}
          onGlobalChange={setGlobalVariables}
        />
      </div>
    </>
  );
};

export default App;
