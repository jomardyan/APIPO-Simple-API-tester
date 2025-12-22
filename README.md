# Quick API Client Desktop (MVP)

[![Build Status](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/build.yml/badge.svg)](https://github.com/jomardyan/APIPO---Simple-API-tester/actions)
[![Tests](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/test.yml/badge.svg)](https://github.com/jomardyan/APIPO---Simple-API-tester/actions/workflows/test.yml)
[![Electron](https://img.shields.io/badge/Electron-39.2.7-blue)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Node Version](https://img.shields.io/badge/Node-18%2B-339933)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](.)

A lightweight, cross-platform desktop API testing tool built with Electron and React. Test REST APIs, GraphQL, WebSocket, and Server-Sent Events with a modern, intuitive interface.

## ✨ Features

### 🚀 Multiple Protocol Support
- **HTTP/REST**: Full support for all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- **GraphQL**: Dedicated GraphQL query editor with variables support
- **WebSocket**: Real-time WebSocket connection testing with message history
- **Server-Sent Events (SSE)**: Monitor SSE streams with automatic event tracking

### 🔐 Authentication Methods
- **Bearer Token**: Simple token-based authentication
- **Basic Auth**: Username/password authentication with Base64 encoding
- **API Key**: Flexible API key injection (header or query parameter)
- **OAuth 2.0**: Manual OAuth token entry support

### 📝 Request Building
- **URL Builder**: Smart URL editor with query parameter management
- **Headers Editor**: Key-value pair editor for custom headers
- **Body Formats**: Support for JSON, form-data, URL-encoded, and raw text
- **Pre-Request Scripts**: JavaScript execution before sending requests
- **Test Scripts**: Post-request assertions and validations
- **Environment Variables**: Template variable substitution with `{{variable}}` syntax

### 📊 Response Handling
- **Formatted Views**: Pretty-print JSON, XML, and HTML responses
- **Raw View**: Toggle between formatted and raw response data
- **Response Headers**: View all response headers with copy functionality
- **Cookies**: Display Set-Cookie headers in dedicated cookies tab
- **Performance Metrics**: Track response time and payload size
- **Status Visualization**: HTTP status codes with descriptions

### 💾 Collections & History
- **Collections**: Organize requests into collections and folders
- **Request History**: Automatic history tracking (last 50 requests)
- **Save & Recall**: Save requests for quick access and reuse
- **Import/Export**: Import Postman collections (v2.1 format) and export data
- **Search & Filter**: Find requests in history and collections

### 🔧 Environment Management
- **Multiple Environments**: Define variables for different stages (dev, staging, prod)
- **Global Variables**: Shared variables across all requests
- **Variable Substitution**: Automatic replacement in URLs, headers, body, and GraphQL variables
- **Quick Switching**: Toggle between environments with one click

### 🎨 User Experience
- **Dark/Light Theme**: System-aware theme with manual override
- **Keyboard Shortcuts**: 
  - `Ctrl/Cmd + Enter`: Send request
  - `Ctrl/Cmd + Shift + B`: Add to bulk queue
  - `Ctrl/Cmd + S`: Save request to collection
- **Bulk Runner**: Queue and execute multiple requests sequentially
- **Console Logs**: Debug panel for request/response logging
- **Cookie Jar**: Automatic cookie storage and management per domain

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/jomardyan/APIPO-Simple-API-tester.git
cd APIPO-Simple-API-tester

# Install dependencies
npm install

# Start development server with hot reload
npm run dev
```

The application will open automatically with Vite dev server running on port 5173.

## 📦 Building & Distribution

### Build for Current Platform
```bash
npm run build      # Bundle renderer + main/preload processes
npm run package    # Create platform-specific installer
```

### Platform-Specific Builds
Installers are created using electron-builder:
- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` or `.deb` packages

### Running Tests
```bash
npm test                  # Run unit tests with Node.js test runner
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Generate coverage report
```

## 🎯 Usage Examples

### Basic HTTP Request
1. Enter URL: `https://jsonplaceholder.typicode.com/posts/1`
2. Select method: `GET`
3. Add headers (optional): `Accept: application/json`
4. Click **Send** or press `Ctrl/Cmd + Enter`
5. View formatted JSON response in the response viewer

### Using Environment Variables
1. Open **Environment Manager** (top bar)
2. Create environment: "Production"
3. Add variable: `API_URL = https://api.example.com`
4. In request URL, use: `{{API_URL}}/users`
5. Variables are automatically substituted when sending request

### GraphQL Query
1. Select protocol: **GraphQL**
2. Enter endpoint: `https://graphql.example.com`
3. Write query in the GraphQL editor:
   ```graphql
   query GetUser($id: ID!) {
     user(id: $id) {
       name
       email
     }
   }
   ```
4. Add variables in the variables panel:
   ```json
   {
     "id": "123"
   }
   ```
5. Send request and view response

### WebSocket Testing
1. Select protocol: **WebSocket**
2. Enter WebSocket URL: `wss://echo.websocket.org`
3. Click **Connect**
4. Send messages in the message input
5. View real-time messages in the events panel

### Collections & Saved Requests
1. Build and test a request
2. Click **Save** or press `Ctrl/Cmd + S`
3. Choose collection and optionally create a folder
4. Saved requests appear in the sidebar
5. Click any saved request to load it

### Importing Postman Collections
1. Open **Settings** panel
2. Click **Import**
3. Select Postman collection JSON file (v2.1 format)
4. Collection and requests are imported automatically

## 🛠️ Technical Architecture

### Technology Stack
- **Frontend**: React 19 with hooks and Zustand state management
- **Desktop Framework**: Electron 39 (Chromium + Node.js)
- **Build Tools**: Vite (renderer) + esbuild (main/preload)
- **HTTP Client**: Axios with cookie jar support
- **Styling**: CSS with CSS variables for theming
- **Code Editor**: react-simple-code-editor with Prism.js syntax highlighting

### Project Structure
```
src/
├── main/           # Electron main process (app lifecycle, IPC)
├── renderer/       # React UI (components, state, utilities)
├── preload/        # Secure IPC bridge
└── shared/         # Constants and types shared across processes
```

### Data Persistence
- **Storage**: Zustand with localStorage persistence
- **Cookie Jar**: Automatic cookie storage per hostname
- **History**: Last 50 requests stored locally
- **Collections**: Unlimited collections with folders and requests

## 🎨 Customization

### Theme Settings
- **System**: Follow OS theme preference (default)
- **Light**: Light mode with high contrast
- **Dark**: Dark mode optimized for low-light environments

### Request Settings
- **Timeout**: Configure request timeout (default: 15 seconds, max: 5 minutes)
- **Credentials**: Enable/disable sending cookies with requests
- **SSL/TLS**: Certificate configuration for client certificates (planned)

## 🤝 Contributing

Contributions are welcome! This is an MVP implementation. See `Quick-API-Client-Desktop.md` for the complete feature roadmap.

### Areas for Contribution
- Drag-and-drop collection organization
- OpenAPI/Swagger import
- Enhanced syntax highlighting
- Response comparison view
- Test automation runner
- Plugin system

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

Built with modern web technologies and inspired by tools like Postman and Insomnia, reimagined as a lightweight, privacy-focused desktop application.

