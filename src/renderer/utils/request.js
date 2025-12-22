import { randomId } from './id.js';

export const parseHeaders = (rows = []) =>
  rows.reduce((acc, row) => {
    if (row.key && row.value) {
      acc[row.key] = row.value;
    }
    return acc;
  }, {});

export const parseParams = (rows = []) => rows.filter((row) => row.key && row.value);

export const prettifyData = (payload) => {
  if (payload === null || payload === undefined) return '';
  if (typeof payload === 'string') return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return String(payload);
  }
};

export const cloneRequest = (request) => JSON.parse(JSON.stringify(request));

export const toEnvMap = (env) =>
  (env?.variables || []).reduce((acc, variable) => {
    if (variable.key) acc[variable.key] = variable.value;
    return acc;
  }, {});

export const substituteTemplate = (value, envMap) => {
  if (!value || typeof value !== 'string') return value;
  return value.replace(/{{\s*([\w.-]+)\s*}}/g, (_match, key) =>
    Object.prototype.hasOwnProperty.call(envMap, key) ? envMap[key] : `{{${key}}}`
  );
};

export const hostnameFromUrl = (raw) => {
  try {
    return new URL(raw).hostname;
  } catch (_error) {
    return '';
  }
};

export const parseSetCookies = (value) => {
  const list = Array.isArray(value) ? value : [value];
  return list.reduce((acc, cookieStr) => {
    if (!cookieStr) return acc;
    const [pair] = cookieStr.split(';');
    const [name, ...rest] = pair.split('=');
    if (!name) return acc;
    acc[name.trim()] = rest.join('=').trim();
    return acc;
  }, {});
};

export const buildCookieHeader = (host, cookieJar) => {
  if (!host || !cookieJar?.[host]) return '';
  const entries = Object.entries(cookieJar[host]);
  return entries.map(([k, v]) => `${k}=${v}`).join('; ');
};

export const buildUrlWithParams = (baseUrl, params) => {
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

export const runPreRequestScript = (script, base, envMap = {}) => {
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

export const runAssertions = (script, response, envMap = {}) => {
  if (!script?.trim()) return [];
  const assertions = [];
  const assert = (condition, message) =>
    assertions.push({ id: randomId(), ok: !!condition, message: message || 'Assertion' });

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('ctx', 'const { assert, response, env } = ctx;\n' + script);
    fn({ response, assert, env: envMap });
  } catch (error) {
    assertions.push({ id: randomId(), ok: false, message: error.message });
  }
  return assertions;
};

export const withAuth = (draftHeaders, draftParams, auth) => {
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
