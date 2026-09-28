const path = require("node:path");
const fs = require("node:fs");
const fsExtra = require("fs-extra");
const { spawn } = require("node:child_process");
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const {
  getActiveLicense,
  activateLicense,
  deactivateLicense,
  matchesLicenseDomain,
  scaffoldProject,
  loadConfig,
  validateConfig,
  saveConfig,
  personalizeGeneratedProject,
} = require("@besaoct/drm-wrap/core");

let mainWindow = null;
let runningProcess = null;
let runningTask = null;

function checkLicenseOrThrow(baseUrl) {
  const result = getActiveLicense();
  if (!result.valid) {
    throw new Error(result.reason);
  }
  if (baseUrl && !matchesLicenseDomain(result.payload, baseUrl)) {
    throw new Error(
      `This license is locked to "${result.payload.domain}", which does not match "${baseUrl}".`
    );
  }
  return result.payload;
}

function listReleaseArtifacts(targetDir) {
  const releaseDir = path.join(targetDir, "release");
  const extensions = new Set([".exe", ".dmg", ".zip"]);
  const results = [];

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
        results.push(fullPath);
      }
    }
  }

  walk(releaseDir);
  return results;
}

function sendLog(task, stream, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("studio:log", { task, stream, line: data.toString() });
  }
}

function sendProcessDone(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("studio:process-done", payload);
  }
}

// DRMWrap ships its own copy of electron + electron-builder (+ drm-wrap, +
// their full dependency trees) — see packages/studio/electron-builder.yml's
// `files: node_modules/**/*`. Rather than requiring the end user to have
// Node.js/npm installed, we vendor DRMWrap's own already-resolved copies of
// these straight into the generated project, then run them directly (the
// real electron binary; electron-builder's CLI executed via DRMWrap's own
// Electron binary in ELECTRON_RUN_AS_NODE mode) — no system npm/npx/node
// ever invoked. This is a straight filesystem copy, not a minimal dependency
// closure, so it vendors more than strictly required (known tradeoff, see
// README) in exchange for guaranteed correctness.
const VENDOR_SKIP = new Set([
  "typescript",
  "@types",
  ".bin",
  ".package-lock.json",
  "drm-wrap-desktop-app",
  "drm-wrap-license-admin",
  "drm-wrap-studio",
]);

function resolveVendorNodeModulesDir() {
  const electronBuilderPkgPath = require.resolve("electron-builder/package.json");
  return path.dirname(path.dirname(electronBuilderPkgPath));
}

function resolveVendoredElectronPath(targetDir) {
  const electronPkgDir = path.join(targetDir, "node_modules", "electron");
  const pathFile = path.join(electronPkgDir, "path.txt");
  if (!fs.existsSync(pathFile)) {
    throw new Error('Electron is not installed in this project yet. Click "Install Dependencies" first.');
  }
  const relExe = fs.readFileSync(pathFile, "utf-8").trim();
  const exePath = path.join(electronPkgDir, "dist", relExe);
  if (!fs.existsSync(exePath)) {
    throw new Error(`Electron binary not found at ${exePath}. Try clicking "Install Dependencies" again.`);
  }
  return exePath;
}

function resolveVendoredElectronBuilderCli(targetDir) {
  const cliPath = path.join(targetDir, "node_modules", "electron-builder", "cli.js");
  if (!fs.existsSync(cliPath)) {
    throw new Error('electron-builder is not installed in this project yet. Click "Install Dependencies" first.');
  }
  return cliPath;
}

function runVendorCopy(targetDir) {
  if (runningProcess || runningTask) {
    throw new Error(`A "${runningTask}" task is already running.`);
  }
  runningTask = "install";

  (async () => {
    const prevNoAsar = process.noAsar;
    process.noAsar = true;
    try {
      const sourceNodeModules = resolveVendorNodeModulesDir();
      const destNodeModules = path.join(targetDir, "node_modules");
      await fsExtra.ensureDir(destNodeModules);
      const entries = await fsExtra.readdir(sourceNodeModules);

      for (const entry of entries) {
        if (VENDOR_SKIP.has(entry) || entry.startsWith("drm-wrap-") || entry.startsWith(".")) continue;
        sendLog("install", "stdout", `Vendoring ${entry}...\n`);
        const isElectron = entry === "electron";
        await fsExtra.copy(path.join(sourceNodeModules, entry), path.join(destNodeModules, entry), {
          dereference: !isElectron,
        });
      }

      if (process.platform === "darwin" || process.platform === "linux") {
        try {
          const pathFile = path.join(destNodeModules, "electron", "path.txt");
          if (fs.existsSync(pathFile)) {
            const relExe = fs.readFileSync(pathFile, "utf-8").trim();
            const exePath = path.join(destNodeModules, "electron", "dist", relExe);
            if (fs.existsSync(exePath)) {
              fs.chmodSync(exePath, 0o755);
            }
          }
        } catch {}
      }

      if (process.platform === "darwin") {
        const destElectronApp = path.join(destNodeModules, "electron", "dist", "Electron.app");
        if (fs.existsSync(destElectronApp)) {
          sendLog("install", "stdout", "Configuring macOS permissions for Electron...\n");
          try {
            const { execFileSync } = require("node:child_process");
            execFileSync("xattr", ["-cr", destElectronApp], { stdio: "ignore" });
            execFileSync("codesign", ["--force", "--deep", "--sign", "-", destElectronApp], { stdio: "ignore" });
          } catch (e) {
            sendLog("install", "stdout", `Note: ad-hoc signing info: ${e.message}\n`);
          }
        }
      }

      sendLog("install", "stdout", "Done — electron, electron-builder, and drm-wrap are ready in this project.\n");
      runningTask = null;
      sendProcessDone({ task: "install", success: true, code: 0 });
    } catch (error) {
      runningTask = null;
      sendLog("install", "stderr", `${error.message || error}\n`);
      sendProcessDone({ task: "install", success: false, code: null, error: error.message });
    } finally {
      process.noAsar = prevNoAsar;
    }
  })();

  return { started: true, task: "install" };
}

function runTask(task, cwd, command, args, extraEnv = {}) {
  if (runningProcess) {
    throw new Error(`A "${runningTask}" task is already running.`);
  }

  runningTask = task;
  const child = spawn(command, args, {
    cwd,
    shell: process.platform === "win32",
    env: { ...process.env, ...extraEnv },
  });
  runningProcess = child;

  child.stdout?.on("data", (data) => sendLog(task, "stdout", data));
  child.stderr?.on("data", (data) => sendLog(task, "stderr", data));

  const finish = (payload) => {
    runningProcess = null;
    runningTask = null;
    const artifacts = task === "build" && payload.success ? listReleaseArtifacts(cwd) : undefined;
    sendProcessDone({ task, ...payload, artifacts });
  };

  child.on("close", (code) => finish({ success: code === 0, code }));
  child.on("error", (error) => finish({ success: false, code: null, error: error.message }));

  return { started: true, task };
}

function registerIpcHandlers() {
  ipcMain.handle("studio:license:status", () => getActiveLicense());
  ipcMain.handle("studio:license:activate", (_event, key) => activateLicense(key));
  ipcMain.handle("studio:license:deactivate", () => {
    deactivateLicense();
    return { valid: false, reason: "Deactivated." };
  });

  ipcMain.handle("studio:dialog:chooseDirectory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("studio:dialog:chooseLogo", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg"] }],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("studio:dialog:chooseExistingProject", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("studio:project:scaffold", async (_event, options) => {
    checkLicenseOrThrow(options.baseUrl);
    return scaffoldProject(options);
  });

  ipcMain.handle("studio:project:loadConfig", (_event, targetDir) => loadConfig(targetDir));

  ipcMain.handle("studio:project:saveConfig", async (_event, targetDir, partialConfig) => {
    const existing = loadConfig(targetDir);
    const merged = validateConfig({
      ...existing,
      ...partialConfig,
      features: { ...existing.features, ...(partialConfig.features ?? {}) },
    });
    saveConfig(merged, targetDir);
    await personalizeGeneratedProject(targetDir, merged.appName);
    return merged;
  });

  ipcMain.handle("studio:project:openInFileManager", (_event, targetPath) => {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      shell.openPath(targetPath);
    } else {
      shell.showItemInFolder(targetPath);
    }
  });

  ipcMain.handle("studio:project:install", (_event, targetDir) => runVendorCopy(targetDir));

  ipcMain.handle("studio:project:dev", (_event, targetDir) => {
    const electronBinary = resolveVendoredElectronPath(targetDir);
    return runTask("dev", targetDir, electronBinary, ["."], { NODE_ENV: "development" });
  });

  ipcMain.handle("studio:project:stopDev", () => {
    if (runningTask === "dev" && runningProcess) {
      runningProcess.kill();
      return { stopped: true };
    }
    return { stopped: false };
  });

  ipcMain.handle("studio:project:build", (_event, targetDir) => {
    const config = loadConfig(targetDir);
    checkLicenseOrThrow(config.baseUrl);
    const cliPath = resolveVendoredElectronBuilderCli(targetDir);
    // electron-builder is a Node CLI; run it under DRMWrap's own bundled
    // Electron binary in "plain Node" mode instead of requiring a system
    // Node.js install (see ELECTRON_RUN_AS_NODE in Electron's docs).
    return runTask("build", targetDir, process.execPath, [cliPath, "--config", "electron-builder.yml"], {
      ELECTRON_RUN_AS_NODE: "1",
      CSC_IDENTITY_AUTO_DISCOVERY: "false",
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 860,
    minHeight: 600,
    title: "DRMWrap",
    icon: path.join(__dirname, "..", "public", "logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "..", "public", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (runningProcess) {
    runningProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
