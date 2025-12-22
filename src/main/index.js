import { app, BrowserWindow, ipcMain, shell, Menu, dialog } from "electron";
import axios from "axios";
import https from "https";
import fs from "fs";
import { CookieJar } from "tough-cookie";
import { wrapper as wrapAxios } from "axios-cookiejar-support";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const jar = new CookieJar();

const broadcastError = (message, detail = "") => {
  console.error("[MainError]", message, detail);
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send(
      "app-error",
      detail ? `${message}: ${detail}` : message
    );
  });
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1260,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#0b1021",
    title: "Quick API Client",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: isDev,
    },
  });

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.webContents.on("context-menu", (_event, params) => {
    const isEditable = params.isEditable;
    const hasSelection = Boolean(params.selectionText?.trim());

    const template = [
      ...(isEditable
        ? [
            { role: "undo" },
            { role: "redo" },
            { type: "separator" },
            { role: "cut" },
            { role: "copy" },
            { role: "paste" },
            { role: "pasteAndMatchStyle" },
            { role: "selectAll" },
          ]
        : []),
      ...(!isEditable && hasSelection
        ? [{ role: "copy" }, { role: "selectAll" }]
        : []),
      { type: "separator" },
      { role: "reload" },
      { role: "toggleDevTools", visible: isDev },
    ];

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
  });

  return mainWindow;
};

const sendAppEvent = (event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.webContents.send("app-accelerator", event);
};

const buildMenu = () => {
  const template = [
    ...(process.platform === "darwin"
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Request",
          accelerator: "CommandOrControl+N",
          click: () => sendAppEvent("new-request"),
        },
        { type: "separator" },
        { role: "close" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "delete" },
        { type: "separator" },
        { role: "selectAll" },
      ],
    },
    {
      label: "Actions",
      submenu: [
        {
          label: "Send Request",
          accelerator: "CommandOrControl+Enter",
          click: () => sendAppEvent("send-request"),
        },
        {
          label: "Add to Bulk Queue",
          accelerator: "CommandOrControl+Shift+B",
          click: () => sendAppEvent("add-to-bulk"),
        },
        {
          label: "Reset Request",
          accelerator: "CommandOrControl+Backspace",
          click: () => sendAppEvent("new-request"),
        },
        {
          label: "Open Settings",
          accelerator: "CommandOrControl+,",
          click: () => sendAppEvent("open-settings"),
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools", visible: isDev },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "close" }],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Quick API Client Docs",
          click: () =>
            shell.openExternal(
              "https://github.com/jomardyan/APIPO---Simple-API-tester"
            ),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();
  buildMenu();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

process.on("uncaughtException", (error) => {
  dialog.showMessageBox({
    type: "error",
    title: "Unexpected Error",
    message: "The app hit an unexpected error.",
    detail: error?.stack || error?.message || String(error),
  });
  broadcastError("Unexpected error", error?.message || "Unknown error");
});

process.on("unhandledRejection", (reason) => {
  const detail =
    typeof reason === "string" ? reason : reason?.stack || reason?.message;
  dialog.showMessageBox({
    type: "error",
    title: "Unhandled Promise Rejection",
    message: "A background operation failed.",
    detail: detail || "Unknown reason",
  });
  broadcastError("Background operation failed", detail || "Unknown reason");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("open-external", (_event, target) => shell.openExternal(target));

const buildHttpsAgent = (certConfig) => {
  if (!certConfig) return undefined;
  const { clientCertPath, clientKeyPath, caPath, rejectUnauthorized } =
    certConfig;
  const agentOptions = { rejectUnauthorized: rejectUnauthorized !== false };
  try {
    if (clientCertPath) agentOptions.cert = fs.readFileSync(clientCertPath);
    if (clientKeyPath) agentOptions.key = fs.readFileSync(clientKeyPath);
    if (caPath) agentOptions.ca = fs.readFileSync(caPath);
  } catch (error) {
    console.error("Cert read error", error);
  }
  return new https.Agent(agentOptions);
};

ipcMain.handle("request:send", async (_event, payload) => {
  const {
    url,
    method = "GET",
    headers = {},
    data,
    timeout = 15000,
    certConfig,
    withCredentials = true,
  } = payload || {};
  if (!url) return { error: "Missing URL" };
  const started = Date.now();
  try {
    // If using custom certs, don't use the cookie jar wrapper (incompatible)
    const hasCustomCerts =
      certConfig &&
      (certConfig.clientCertPath ||
        certConfig.clientKeyPath ||
        certConfig.caPath);

    const client =
      !hasCustomCerts && withCredentials
        ? wrapAxios(axios.create({ jar, withCredentials: true }))
        : axios.create({
            withCredentials: withCredentials ? true : false,
            httpsAgent: hasCustomCerts
              ? buildHttpsAgent(certConfig)
              : undefined,
          });

    const res = await client.request({
      url,
      method,
      headers,
      data,
      timeout,
      validateStatus: () => true,
    });
    const duration = Date.now() - started;
    return {
      status: res.status,
      statusText: res.statusText,
      data: res.data,
      headers: res.headers,
      duration,
      error: null,
    };
  } catch (error) {
    const duration = Date.now() - started;
    const res = error?.response;
    return {
      status: res?.status ?? null,
      statusText: res?.statusText ?? "Request Failed",
      data: res?.data ?? error.message,
      headers: res?.headers ?? {},
      duration,
      error: error.message,
    };
  }
});

ipcMain.handle("cookies:clear", async () => {
  try {
    await new Promise((resolve, reject) => {
      jar.removeAllCookies((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
    return { ok: true };
  } catch (error) {
    console.error("Cookie clear failed", error);
    return { ok: false, error: error.message };
  }
});

app.on("render-process-gone", (_event, webContents, details) => {
  const reason = details?.reason || "Renderer crashed";
  broadcastError("Renderer process issue", reason);
});
