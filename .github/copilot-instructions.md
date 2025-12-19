# Copilot Instructions for APIPO Quick API Client Desktop

## Project Overview
This is an Electron desktop application for testing REST APIs—a cross-platform alternative to Postman. The application enables developers to build HTTP requests, manage collections, view formatted responses, and handle authentication across Windows, macOS, and Linux.

**Key Design Principle**: Prioritize user productivity for API developers through a responsive, feature-rich desktop experience without browser limitations.

## Architecture Overview

### Three-Process Electron Model
- **Main Process** (`src/main/`): Manages app lifecycle, windows, menus, and file I/O
- **Renderer Process** (`src/renderer/`): React-based UI with request builder, response viewer, and collection management
- **Preload Scripts** (`src/preload/`): Secure IPC bridge between main and renderer processes

### Key Data Flows
1. **Request Execution**: Renderer → Main (HTTP request) → Axios/fetch → Response → Renderer (display)
2. **Persistence**: Renderer (state) ↔ Main (SQLite/NeDB) → Disk
3. **Environment Switching**: Collections contain environment variables; applied at request time before execution

## Critical Conventions

### IPC Channel Naming
Use kebab-case with semantic prefixes:
- `request:send` - Execute an API request
- `request:history-add` - Store in history
- `collection:save` - Persist collection
- `env:apply` - Switch active environment

### Component Structure
- **Pages**: Full-screen UI sections (RequestBuilder, History, Collections, Settings)
- **Components**: Reusable UI pieces (ResponseViewer, HeaderEditor, AuthSelector)
- **Hooks**: `useRequest()` for request state, `useCollections()` for storage

### State Management Pattern
Use Zustand for global state (currently active collection, environment, theme). Local React state for temporary UI interactions (form inputs, modals).

### Storage Schema Example
```json
{
  "collections": [
    {
      "id": "uuid",
      "name": "API Name",
      "requests": [{ "id", "name", "method", "url", "headers", "body", "auth" }],
      "environments": [{ "name": "dev", "variables": { "baseUrl": "http://..." } }]
    }
  ],
  "history": [{ "id", "timestamp", "request", "response", "duration" }],
  "settings": { "theme": "dark", "defaultEnv": "dev" }
}
```

## Essential Development Workflows

### Setup & Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start dev server with hot reload
npm run build                  # Build for current platform
npm run build:all              # Build for Win/Mac/Linux
```

### Testing
- Unit tests: Jest for utility functions in `src/shared/`
- Integration tests: Spectron for Electron window/IPC interactions
- No E2E tests yet; plan for Playwright once UI stabilizes

### Building & Distribution
- Use `electron-builder` (configured in `electron-builder.json`)
- Generates installers (.exe, .dmg, .AppImage) and auto-update packages
- Publish to GitHub Releases, then optionally to app stores

## Integration Points & Dependencies

### HTTP Client Strategy
- Use Axios with custom interceptor for request/response hooks
- Support proxies via Node.js `http` module options
- Handle redirects (max 5) and timeouts (30s default, configurable)

### Authentication Implementations
- **Bearer Token**: Add `Authorization: Bearer <token>` header
- **Basic Auth**: Compute Base64 `Authorization: Basic <encoded>` header
- **API Key**: Inject into header or query parameter (configurable per collection)
- **OAuth 2.0**: Store refresh tokens encrypted in keytar; exchange for access token on request

### Encryption Strategy
- Use `node-keytar` to integrate with system credential stores (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Never store raw API keys in SQLite; store references or encrypted values only

### Import/Export Formats
- **Postman Collections** (v2.1): Parse `items[]` array; map to internal request structure
- **OpenAPI/Swagger**: Extract paths as requests; infer method/parameters from spec
- **Export**: Generate JSON matching our schema; also support Postman format for interoperability

## Project Structure Expectations

```
src/
├── main/                      # Electron main process
│   ├── index.js              # App initialization
│   ├── menu.js               # App menu (File, Edit, View, Help)
│   ├── window.js             # Create/manage BrowserWindow
│   └── ipc.js                # Define all IPC listeners
├── renderer/                 # React application
│   ├── components/
│   │   ├── RequestBuilder.jsx # URL, method, headers, body, auth
│   │   ├── ResponseViewer.jsx # Display & format responses
│   │   └── CollectionsList.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── History.jsx
│   │   └── Settings.jsx
│   ├── hooks/
│   │   ├── useRequest.js     # Request execution state
│   │   └── useCollections.js # CRUD for collections
│   ├── store/
│   │   ├── appStore.js       # Global Zustand store
│   │   └── types.js
│   ├── utils/
│   │   ├── formatters.js     # JSON/XML/HTML formatting
│   │   ├── validators.js     # URL, header validation
│   │   └── parseImports.js   # Postman/OpenAPI parsing
│   └── App.jsx
├── shared/
│   ├── constants.js          # HTTP methods, status codes
│   └── types.js              # TypeScript interfaces
└── preload/
    └── index.js              # Expose safe IPC methods
```

## Common Patterns to Follow

### Request Execution
1. Validate URL and headers in renderer before sending IPC
2. Apply environment variables (substitute `${VAR}` in URL/headers/body)
3. Build Axios config with auth, timeout, redirect settings
4. Execute in main process; return `{ status, body, headers, duration, timestamp }`
5. Store in history automatically; display in response viewer

### Error Handling
- Network errors (ECONNREFUSED, timeout) → Show user-friendly message with suggestion (check URL, network)
- Validation errors → Highlight field in red with reason
- Auth failures (401/403) → Suggest re-entering credentials

## Development Tips
- Hot reload works on renderer changes; main process changes require app restart
- Use `ng serve` or dev server for faster feedback during UI work
- Test with large JSON payloads (>1MB) to ensure response viewer doesn't freeze
- Keyboard shortcuts for power users: `Ctrl+Enter` to send, `Ctrl+S` to save, `Ctrl+L` to focus URL
