// Minimal Windows-first Electron host for the Stremio web application.
// The production bundle is served from loopback HTTP so workers and WASM keep
// a normal secure-origin-like URL base instead of running under file://.
const { app, BrowserWindow, Notification, dialog, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const LOOPBACK_HOST = '127.0.0.1';
const DEV_URL_FLAG = '--dev-server=';
// Windows currently exposes VLC as the configured native external player.
// Keep custom protocols narrow; stream/add-on data must not launch arbitrary apps.
const EXTERNAL_PLAYER_SCHEMES = new Set(['vlc:']);
const CONTENT_TYPES = new Map([
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.css', 'text/css; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.wasm', 'application/wasm'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.webp', 'image/webp'],
    ['.woff2', 'font/woff2'],
    ['.ttf', 'font/ttf'],
    ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);
// The official service listens on 11470 (or the next free port) and its
// desktop/Web entry point owns CORS for the `127.0.0.1:11470` origin. This
// packaged UI has its own loopback origin, so adapt only service responses on
// the official loopback port ranges for this app's own renderer. Never relax
// CORS for remote hosts or other pages.
const isOfficialServiceUrl = (value) => {
    try {
        const url = new URL(value);
        const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
        const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
        const servicePort = (port >= 11470 && port <= 11499) || (port >= 12470 && port <= 12499);
        return loopback && servicePort;
    } catch {
        return false;
    }
};

let staticServer;
let desktopOrigin;

const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};

const isAllowedExternalPlayerUrl = (value) => {
    try {
        return EXTERNAL_PLAYER_SCHEMES.has(new URL(value).protocol);
    } catch {
        return false;
    }
};

const openExternalUrl = (url) => {
    if (isHttpUrl(url) || isAllowedExternalPlayerUrl(url)) shell.openExternal(url).catch(() => {});
};

const devServerUrl = () => {
    const arg = process.argv.find((value) => value.startsWith(DEV_URL_FLAG));
    const value = arg ? arg.slice(DEV_URL_FLAG.length) : process.env.STREMIO_DESKTOP_DEV_SERVER_URL;
    if (!value) return null;

    const url = new URL(value);
    const allowedHost = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (!allowedHost || !['http:', 'https:'].includes(url.protocol)) {
        throw new Error('The desktop development server must use HTTP(S) on localhost.');
    }

    return url.toString();
};

const getBuildDirectory = () => app.isPackaged
    ? path.join(process.resourcesPath, 'build')
    : path.join(__dirname, '..', '..', 'build');

const startStaticServer = async (root) => new Promise((resolve, reject) => {
    const resolvedRoot = path.resolve(root);
    const indexPath = path.join(resolvedRoot, 'index.html');
    if (!fs.existsSync(indexPath)) {
        reject(new Error(`The production web build was not found at ${resolvedRoot}. Run pnpm desktop:build first.`));
        return;
    }

    const server = http.createServer((request, response) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            response.writeHead(405, { Allow: 'GET, HEAD' }).end();
            return;
        }

        let pathname;
        try {
            pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
        } catch {
            response.writeHead(400).end('Bad request');
            return;
        }

        const relativePath = pathname.replace(/^\/+/, '');
        let filePath = path.resolve(resolvedRoot, relativePath || 'index.html');
        if (!filePath.startsWith(`${resolvedRoot}${path.sep}`) && filePath !== indexPath) {
            response.writeHead(403).end('Forbidden');
            return;
        }

        if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
            if (path.extname(relativePath)) {
                response.writeHead(404).end('Not found');
                return;
            }
            // Extensionless paths are client-side routes; missing assets stay 404s.
            filePath = indexPath;
        }

        const contentType = CONTENT_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
        response.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': path.basename(filePath) === 'index.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        });
        if (request.method === 'HEAD') response.end();
        else fs.createReadStream(filePath).pipe(response);
    });

    server.once('error', reject);
    server.listen(0, LOOPBACK_HOST, () => {
        const address = server.address();
        if (!address || typeof address === 'string') {
            server.close();
            reject(new Error('Could not bind the desktop app to loopback.'));
            return;
        }
        staticServer = server;
        resolve(`http://${LOOPBACK_HOST}:${address.port}/`);
    });
});

const createWindow = async () => {
    const devUrl = devServerUrl();
    const appUrl = devUrl || await startStaticServer(getBuildDirectory());
    desktopOrigin = new URL(appUrl).origin;

    const window = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'stremio.ico'),
        show: false,
        backgroundColor: '#101014',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            webviewTag: false,
            spellcheck: false,
        },
    });

    window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    window.webContents.session.setPermissionCheckHandler(() => false);
    window.webContents.session.on('will-download', async (event, item, contents) => {
        if (contents !== window.webContents) {
            item.cancel();
            return;
        }

        item.pause();
        let saveResult;
        try {
            saveResult = await dialog.showSaveDialog(window, {
                title: 'Save video',
                defaultPath: path.join(app.getPath('downloads'), item.getFilename()),
                buttonLabel: 'Save',
            });
        } catch {
            item.cancel();
            return;
        }
        if (saveResult.canceled || !saveResult.filePath) {
            item.cancel();
            return;
        }

        item.setSavePath(saveResult.filePath);
        item.once('done', (_downloadEvent, state) => {
            if (state === 'completed' && Notification.isSupported()) {
                new Notification({
                    title: 'Download complete',
                    body: path.basename(saveResult.filePath),
                }).show();
            }
        });
        item.resume();
    });

    // Stremio Service intentionally does not return CORS headers for an
    // arbitrary web-app port. Add them only for its loopback service ports and
    // only when the caller is this window's exact origin. This keeps remote
    // requests and unrelated local web apps under normal browser CORS rules.
    window.webContents.session.webRequest.onHeadersReceived(
        { urls: ['http://127.0.0.1:*/*', 'http://localhost:*/*', 'https://127.0.0.1:*/*', 'https://localhost:*/*'] },
        (details, callback) => {
            const origin = details.initiatorOrigin;
            if (origin === desktopOrigin && isOfficialServiceUrl(details.url)) {
                const responseHeaders = { ...details.responseHeaders };
                const setHeader = (name, value) => {
                    const existing = Object.keys(responseHeaders).find((key) => key.toLowerCase() === name.toLowerCase());
                    responseHeaders[existing || name] = [value];
                };
                setHeader('Access-Control-Allow-Origin', desktopOrigin);
                setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
                setHeader('Access-Control-Allow-Headers', 'content-type, authorization, range, x-requested-with');
                setHeader('Access-Control-Max-Age', '600');
                callback({ responseHeaders });
                return;
            }

            callback({ responseHeaders: details.responseHeaders });
        }
    );

    window.webContents.setWindowOpenHandler(({ url }) => {
        openExternalUrl(url);
        return { action: 'deny' };
    });
    window.webContents.on('will-navigate', (event, url) => {
        if (url === desktopOrigin || url.startsWith(`${desktopOrigin}/`) || url.startsWith(`${desktopOrigin}#`)) return;
        event.preventDefault();
        openExternalUrl(url);
    });

    // Webpack's development server uses a local self-signed certificate. Only
    // allow that exception for the explicitly selected localhost dev origin.
    if (devUrl && new URL(devUrl).protocol === 'https:') {
        app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
            const parsed = new URL(url);
            if (parsed.origin === desktopOrigin && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
                event.preventDefault();
                callback(true);
            } else {
                callback(false);
            }
        });
    }

    window.once('ready-to-show', () => window.show());
    window.on('closed', () => { desktopOrigin = null; });
    await window.loadURL(appUrl);
};

app.whenReady().then(createWindow).catch((error) => {
    console.error('Failed to start Stremio Enhanced desktop app:', error);
    app.quit();
});


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    if (staticServer) staticServer.close();
});
