import assert from 'node:assert/strict';
import { test } from 'node:test';

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
};

globalThis.localStorage = createMemoryStorage();

const loadStore = async () => {
  const module = await import('../src/renderer/store/useAppStore.js');
  return module.useAppStore;
};

const resetStore = (useAppStore) => {
  useAppStore.setState({
    history: [],
    collections: [],
    cookieJar: {},
    settings: {
      theme: 'system',
      timeout: 15000,
      withCredentials: true,
      certConfig: {
        clientCertPath: '',
        clientKeyPath: '',
        caPath: '',
        rejectUnauthorized: true
      }
    },
    activeEnvironmentId: 'env-local'
  });
};

test('addHistory caps entries at 50 and prepends newest', async () => {
  const useAppStore = await loadStore();
  resetStore(useAppStore);

  const { addHistory } = useAppStore.getState();
  for (let i = 0; i < 55; i += 1) {
    addHistory({ id: `h-${i}` });
  }

  const { history } = useAppStore.getState();
  assert.equal(history.length, 50);
  assert.equal(history[0].id, 'h-54');
});

test('updateSettings merges without overwriting other fields', async () => {
  const useAppStore = await loadStore();
  resetStore(useAppStore);

  const { updateSettings } = useAppStore.getState();
  updateSettings({ timeout: 5000 });

  const { settings } = useAppStore.getState();
  assert.equal(settings.timeout, 5000);
  assert.equal(settings.theme, 'system');
});

test('collections support folders and request entries', async () => {
  const useAppStore = await loadStore();
  resetStore(useAppStore);

  const { addCollection, addFolder, saveRequestToCollection } = useAppStore.getState();
  addCollection('Workspace', 'col-1');
  addFolder('col-1', 'Basics');
  const folderId = useAppStore.getState().collections[0].folders[0].id;

  saveRequestToCollection({
    collectionId: 'col-1',
    folderId,
    request: { method: 'GET', url: 'https://example.com' },
    label: 'Example'
  });

  const folder = useAppStore.getState().collections[0].folders[0];
  assert.equal(folder.requests.length, 1);
  assert.equal(folder.requests[0].label, 'Example');
});

test('upsertCookies merges cookies by host', async () => {
  const useAppStore = await loadStore();
  resetStore(useAppStore);

  const { upsertCookies } = useAppStore.getState();
  upsertCookies('example.com', { sid: 'one' });
  upsertCookies('example.com', { theme: 'dark' });

  const { cookieJar } = useAppStore.getState();
  assert.deepEqual(cookieJar['example.com'], { sid: 'one', theme: 'dark' });
});
