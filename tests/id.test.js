import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomId } from '../src/renderer/utils/id.js';

test('randomId returns a string', () => {
  const value = randomId();
  assert.equal(typeof value, 'string');
  assert.ok(value.length > 0);
});

test('randomId uses crypto.randomUUID when available', () => {
  if (!globalThis.crypto || !globalThis.crypto.randomUUID) {
    assert.ok(true);
    return;
  }

  const original = globalThis.crypto.randomUUID;
  globalThis.crypto.randomUUID = () => 'test-uuid';

  try {
    assert.equal(randomId(), 'test-uuid');
  } finally {
    globalThis.crypto.randomUUID = original;
  }
});

test('randomId falls back when crypto.randomUUID is missing', () => {
  if (!globalThis.crypto) {
    const value = randomId();
    assert.ok(value.startsWith('id-'));
    return;
  }

  const original = globalThis.crypto.randomUUID;
  globalThis.crypto.randomUUID = undefined;

  try {
    const value = randomId();
    assert.ok(value.startsWith('id-'));
  } finally {
    globalThis.crypto.randomUUID = original;
  }
});
