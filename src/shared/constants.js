export const HTTP_METHODS = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "PATCH", value: "PATCH" },
  { label: "DELETE", value: "DELETE" },
  { label: "HEAD", value: "HEAD" },
  { label: "OPTIONS", value: "OPTIONS" },
];

export const DEFAULT_REQUEST = {
  protocol: "http",
  method: "GET",
  url: "",
  headers: [{ id: "header-1", key: "", value: "" }],
  params: [{ id: "param-1", key: "", value: "" }],
  bodyMode: "json",
  body: "",
  graphqlQuery: "",
  graphqlVariables: '{\n  "input": {}\n}',
  formData: [{ id: "form-1", key: "", value: "" }],
  preRequestScript: "",
  testScript: "",
  auth: {
    type: "none",
    token: "",
    oauthToken: "",
    apiKeyKey: "",
    apiKeyValue: "",
    apiKeyAddTo: "header",
    username: "",
    password: "",
  },
};

export const THEMES = ["system", "light", "dark"];

// App configuration constants
export const MAX_HISTORY_ENTRIES = 50;
export const MAX_EXPORT_HISTORY = 200;
export const SPLASH_DURATION_MS = 720;
export const WEBSOCKET_TIMEOUT_MS = 6000;
export const SSE_TIMEOUT_MS = 6000;
export const SSE_MAX_EVENTS = 8;
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
export const MAX_REQUEST_TIMEOUT_MS = 300000;

// Font stacks
export const MONO_FONT_STACK =
  '"Berkeley Mono", "SFMono-Regular", Consolas, Menlo, monospace';
