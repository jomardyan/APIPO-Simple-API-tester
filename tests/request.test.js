import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildCookieHeader,
  buildUrlWithParams,
  hostnameFromUrl,
  parseHeaders,
  parseParams,
  parseSetCookies,
  runAssertions,
  runPreRequestScript,
  substituteTemplate,
  withAuth
} from '../src/renderer/utils/request.js';

test('substituteTemplate replaces known keys and preserves unknown keys', () => {
  const env = { HOST: 'https://example.com' };
  const value = 'Call {{HOST}} and {{MISSING}}';
  assert.equal(substituteTemplate(value, env), 'Call https://example.com and {{MISSING}}');
});

test('buildUrlWithParams appends query parameters', () => {
  const url = buildUrlWithParams('https://example.com/api', [{ key: 'q', value: 'a b' }]);
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('q'), 'a b');
});

test('buildUrlWithParams falls back for invalid URLs', () => {
  const url = buildUrlWithParams('not a url', [{ key: 'x', value: '1' }]);
  assert.equal(url, 'not a url?x=1');
});

test('parseHeaders and parseParams ignore empty rows', () => {
  const headers = parseHeaders([{ key: 'X', value: '1' }, { key: '', value: '2' }]);
  const params = parseParams([{ key: 'a', value: 'b' }, { key: '', value: 'c' }]);
  assert.deepEqual(headers, { X: '1' });
  assert.deepEqual(params, [{ key: 'a', value: 'b' }]);
});

test('runPreRequestScript mutates headers, params, and body', () => {
  const base = { headers: { Accept: 'json' }, params: [], body: 'old', formData: [] };
  const script = `
    ctx.setHeader('X-Test', 'yes');
    ctx.setQuery('page', '2');
    ctx.setBody('new');
    ctx.setFormField('file', 'demo');
  `;
  const result = runPreRequestScript(script, base, { ENV: 'test' });
  assert.equal(result.headers['X-Test'], 'yes');
  assert.equal(result.params[0].key, 'page');
  assert.equal(result.body, 'new');
  assert.equal(result.formData[0].key, 'file');
});

test('runAssertions captures success and failures', () => {
  const script = `
    assert(response.status === 200, 'ok');
    assert(false, 'bad');
  `;
  const assertions = runAssertions(script, { status: 200 }, {});
  assert.equal(assertions.length, 2);
  assert.equal(assertions[0].ok, true);
  assert.equal(assertions[1].ok, false);
});

test('runAssertions returns error when script throws', () => {
  const assertions = runAssertions('throw new Error("boom")', {}, {});
  assert.equal(assertions.length, 1);
  assert.equal(assertions[0].ok, false);
  assert.equal(assertions[0].message, 'boom');
});

test('withAuth handles bearer, api key, and basic auth', () => {
  globalThis.btoa = (input) => Buffer.from(input).toString('base64');

  const bearer = withAuth({}, [], { type: 'bearer', token: 'token' });
  assert.equal(bearer.headers.Authorization, 'Bearer token');

  const apiKeyQuery = withAuth({}, [], {
    type: 'apiKey',
    apiKeyKey: 'X-API',
    apiKeyValue: 'secret',
    apiKeyAddTo: 'query'
  });
  assert.equal(apiKeyQuery.params.length, 1);
  assert.equal(apiKeyQuery.params[0].key, 'X-API');

  const basic = withAuth({}, [], { type: 'basic', username: 'u', password: 'p' });
  assert.equal(basic.headers.Authorization, 'Basic dTpw');
});

test('parseSetCookies and buildCookieHeader handle cookie data', () => {
  const parsed = parseSetCookies(['a=1; Path=/', 'b=2']);
  assert.deepEqual(parsed, { a: '1', b: '2' });

  const header = buildCookieHeader('example.com', { 'example.com': parsed });
  assert.equal(header, 'a=1; b=2');
});

test('hostnameFromUrl returns hostname or empty string', () => {
  assert.equal(hostnameFromUrl('https://example.com/path'), 'example.com');
  assert.equal(hostnameFromUrl('not-a-url'), '');
});
