import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_REQUEST } from '#shared/constants';
import { randomId } from '../utils/id.js';

const persistConfig = {
  name: 'quick-api-client-store',
  partialize: (state) => ({
    history: state.history,
    settings: state.settings,
    collections: state.collections,
    environments: state.environments,
    globalVariables: state.globalVariables,
    activeEnvironmentId: state.activeEnvironmentId,
    cookieJar: state.cookieJar
  })
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      history: [],
      collections: [],
      environments: [
        {
          id: 'env-local',
          name: 'Local',
          variables: [
            { id: randomId(), key: 'HOST', value: 'http://localhost:3000' },
            { id: randomId(), key: 'TOKEN', value: 'dev-token' }
          ]
        }
      ],
      globalVariables: [
        { id: randomId(), key: 'ORG', value: 'acme' },
        { id: randomId(), key: 'REGION', value: 'us-east-1' }
      ],
      activeEnvironmentId: 'env-local',
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
      cookieJar: {},
      addHistory: (entry) => {
        const next = [entry, ...get().history].slice(0, 50);
        set({ history: next });
      },
      clearHistory: () => set({ history: [] }),
      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch }
        })),
      setGlobalVariables: (variables) => {
        if (!Array.isArray(variables)) return;
        set({ globalVariables: variables });
      },
      setCookieJar: (jar) => set({ cookieJar: jar || {} }),
      upsertCookies: (host, cookies) => {
        if (!host || !cookies) return;
        set((state) => {
          const next = { ...state.cookieJar };
          const current = next[host] || {};
          const merged = { ...current, ...cookies };
          next[host] = merged;
          return { cookieJar: next };
        });
      },
      clearCookies: () => set({ cookieJar: {} }),
      resetRequestDraft: () => DEFAULT_REQUEST,
      addCollection: (name, id) => {
        if (!name) return;
        const collection = {
          id: id || randomId(),
          name,
          folders: [],
          requests: []
        };
        set((state) => ({ collections: [collection, ...state.collections] }));
      },
      addFolder: (collectionId, folderName) => {
        if (!collectionId || !folderName) return;
        set((state) => ({
          collections: state.collections.map((col) =>
            col.id === collectionId
              ? { ...col, folders: [{ id: randomId(), name: folderName, requests: [] }, ...col.folders] }
              : col
          )
        }));
      },
      saveRequestToCollection: ({ collectionId, folderId, request, label }) => {
        if (!collectionId || !request) return;
        const entry = {
          id: randomId(),
          label: label || request.url || 'Untitled request',
          request,
          createdAt: Date.now()
        };
        set((state) => ({
          collections: state.collections.map((col) => {
            if (col.id !== collectionId) return col;
            if (folderId) {
              return {
                ...col,
                folders: col.folders.map((folder) =>
                  folder.id === folderId
                    ? { ...folder, requests: [entry, ...folder.requests] }
                    : folder
                )
              };
            }
            return { ...col, requests: [entry, ...col.requests] };
          })
        }));
      },
      replaceCollections: (collections) => set({ collections })
      ,
      addEnvironment: (name) => {
        if (!name) return;
        const env = { id: randomId(), name, variables: [{ id: randomId(), key: '', value: '' }] };
        set((state) => ({
          environments: [env, ...state.environments],
          activeEnvironmentId: state.activeEnvironmentId || env.id
        }));
      },
      updateEnvironment: (envId, patch) => {
        set((state) => ({
          environments: state.environments.map((env) =>
            env.id === envId ? { ...env, ...patch } : env
          )
        }));
      },
      deleteEnvironment: (envId) => {
        set((state) => {
          const next = state.environments.filter((env) => env.id !== envId);
          const active =
            state.activeEnvironmentId === envId ? next[0]?.id || '' : state.activeEnvironmentId;
          return { environments: next, activeEnvironmentId: active };
        });
      },
      setActiveEnvironment: (envId) => set({ activeEnvironmentId: envId })
    }),
    persistConfig
  )
);
