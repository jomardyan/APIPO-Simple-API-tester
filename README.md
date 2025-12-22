# Quick API Client Desktop (MVP)

[![Build Status](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/build.yml/badge.svg)](https://github.com/jomardyan/APIPO---Simple-API-tester/actions)
[![Tests](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/test.yml/badge.svg)](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/test.yml)
[![Electron](https://img.shields.io/badge/Electron-39.2.7-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node-18%2B-339933)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](.)

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
npm test           # run unit tests with Node.js test runner
npm run test:watch # run tests in watch mode
npm run test:coverage # run tests with coverage report
```

## Testing

Tests are written using Node.js's built-in test runner and can be run using the following methods:

**Command Line:**

```bash
npm test              # run all tests once
npm run test:watch    # run tests in watch mode (re-run on file changes)
npm run test:coverage # run tests with coverage report
```

**VS Code Integration:**

- **Run via Tasks**: Press `Ctrl/Cmd+Shift+P` → "Tasks: Run Task" → "Run All Tests"
- **Debug Tests**: Press `F5` and select "Run All Tests" or "Debug Current Test File"
- **Keyboard Shortcut**: `Ctrl/Cmd+Shift+B` to run the default test task

**Note:** VS Code's native Test Explorer does not yet support Node.js's built-in test runner. Use the Tasks and Launch configurations above for the best experience.

Test files are located in the `tests/` directory and follow the `*.test.js` naming pattern.

## Distribution

The app builds for all major platforms:

- **Linux**: AppImage and .deb packages
- **macOS**: Universal .dmg (Intel + Apple Silicon)
- **Windows**: NSIS installer and portable .exe

Use GitHub Actions workflow (`.github/workflows/build.yml`) to build for all platforms automatically.

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
