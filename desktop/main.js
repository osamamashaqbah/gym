const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const BACKEND_PORT = 5080;
const FRONTEND_PORT = 4300;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

let backendProcess = null;
let staticServer = null;
let mainWindow = null;

function backendExePath() {
  return path.join(__dirname, 'resources', 'backend', 'GymManagement.Api.exe');
}

function frontendDir() {
  return path.join(__dirname, 'resources', 'frontend');
}

function startBackend() {
  const exe = backendExePath();
  if (!fs.existsSync(exe)) {
    console.error('Backend executable not found at', exe);
    return;
  }
  backendProcess = spawn(exe, [], {
    cwd: path.dirname(exe),
    env: {
      ...process.env,
      ASPNETCORE_ENVIRONMENT: 'Desktop',
      ASPNETCORE_URLS: BACKEND_URL
    },
    windowsHide: true
  });
  backendProcess.stdout.on('data', (d) => console.log(`[backend] ${d}`));
  backendProcess.stderr.on('data', (d) => console.error(`[backend] ${d}`));
  backendProcess.on('exit', (code) => console.log(`[backend] exited with code ${code}`));
}

function waitForBackend(timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(`${BACKEND_URL}/health`, (res) => {
        if (res.statusCode === 200) return resolve();
        retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) return reject(new Error('Backend did not start in time'));
      setTimeout(tick, 400);
    };
    tick();
  });
}

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2'
};

function startStaticServer() {
  const root = frontendDir();
  staticServer = http.createServer((req, res) => {
    if (req.url.startsWith('/api')) {
      const proxyReq = http.request(
        `${BACKEND_URL}${req.url}`,
        { method: req.method, headers: req.headers },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        }
      );
      proxyReq.on('error', () => { res.writeHead(502); res.end('Backend unavailable'); });
      req.pipe(proxyReq);
      return;
    }

    let filePath = path.join(root, decodeURIComponent(req.url.split('?')[0]));
    if (!filePath.startsWith(root)) filePath = path.join(root, 'index.html');
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html');
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => staticServer.listen(FRONTEND_PORT, '127.0.0.1', resolve));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false }
  });

  await mainWindow.loadURL(`http://127.0.0.1:${FRONTEND_PORT}`);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  startBackend();
  await startStaticServer();
  try {
    await waitForBackend();
  } catch (e) {
    console.error(e);
  }
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  if (staticServer) staticServer.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
