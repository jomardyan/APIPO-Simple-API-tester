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

