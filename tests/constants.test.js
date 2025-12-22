import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DEFAULT_REQUEST, HTTP_METHODS, THEMES } from '../src/shared/constants.js';

test('DEFAULT_REQUEST has expected defaults', () => {
  assert.equal(DEFAULT_REQUEST.method, 'GET');
  assert.equal(DEFAULT_REQUEST.protocol, 'http');
  assert.ok(Array.isArray(DEFAULT_REQUEST.headers));
  assert.ok(Array.isArray(DEFAULT_REQUEST.params));
});

test('HTTP_METHODS includes core methods', () => {
  const values = HTTP_METHODS.map((entry) => entry.value);
  assert.ok(values.includes('GET'));
  assert.ok(values.includes('POST'));
  assert.ok(values.includes('DELETE'));
});

test('THEMES includes system, light, dark', () => {
  assert.deepEqual(THEMES, ['system', 'light', 'dark']);
});
