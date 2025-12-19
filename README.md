# Quick API Client Desktop (MVP)

Phase 1 implementation of the desktop API tester described in `Quick-API-Client-Desktop.md`. This Electron + React app includes a simple request builder (GET/POST), formatted response viewer, local request history, and a minimal settings drawer.

## Getting Started

```bash
npm install
npm run dev        # starts Vite + esbuild watchers + Electron with live reload
```

## Building

```bash
npm run build      # bundle renderer + main/preload
npm run package    # create platform-specific installers via electron-builder
```

## Project Layout

- `src/main` – Electron main process
- `src/preload` – Secure bridge for renderer
- `src/renderer` – React UI
- `src/shared` – Shared constants and utilities
- `build` – Build configs for Vite/esbuild

## Phase 1 Features

- Request builder supporting GET and POST with custom headers and JSON body
- Formatted response viewer with status, timing, and size info
- Local request history with quick recall and clear actions
- Settings panel for theme and request timeout (persisted locally)

## Phase 2 Additions

- All HTTP methods supported with query param builder
- Auth options: Bearer token, API Key (header/query), Basic auth
- Collections with folders, save current request to a collection, and recall saved requests
- Import/Export collections as JSON for sharing

## Phase 3 Additions

- Environment manager with variable substitution (`{{VAR}}`) and quick env selector in the top bar
- Pre-request scripting (setHeader/setQuery/setBody) and response assertions via `assert(...)`
- Bulk queue runner to execute multiple saved/current requests sequentially
- History/collections/bulk tabs unified in the sidebar for faster workflows

## Phase 4 Polish

- Response viewer tabs (body/headers/assertions) with copy helpers and size badges
- Cancel in-flight requests, plus keyboard shortcuts (Ctrl/Cmd+Enter to send, Ctrl/Cmd+Shift+B to queue)
- Minor UI refinements to request header/actions layout and tab styling

## Native Integrations

- Application menu adds Send Request (Cmd/Ctrl+Enter) and Add to Bulk Queue (Cmd/Ctrl+Shift+B) accelerators wired through Electron to the renderer

## Spec Alignment Highlights

- Body editors: JSON/XML/raw plus form-data key/value editor
- Auth: Bearer, API Key, Basic, and manual OAuth 2.0 token entry
- Response: tabs for body/headers/assertions with raw/pretty toggle and copy
- History: inline search/filter, clear; collections import/export including Postman collections
- Console: request/response/error log panel fed by Axios interceptors

Next phases can extend HTTP method coverage, collections, environments, and import/export flows.
