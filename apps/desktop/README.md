# Stremio Enhanced desktop shell

This Windows-first Electron shell hosts the existing web application in a standalone desktop window. It reuses the web build and its login/account behavior; it is not a native rewrite of the UI or player.

## Development

Start the existing webpack development server in one terminal:

```sh
pnpm start
```

Then open the desktop window in a second terminal:

```sh
pnpm desktop:dev
```

The default development URL is `http://localhost:8080`, matching the current local webpack server. To use another localhost URL, including HTTPS, pass `--dev-server=<url>` after the Electron app path or set `STREMIO_DESKTOP_DEV_SERVER_URL`; any self-signed-certificate exception is limited to that explicitly selected localhost dev origin.

## Build and package for Windows

```sh
pnpm desktop:build
pnpm desktop:pack
```

`desktop:build` creates the production web build with service-worker registration disabled for the desktop host. The packaged application serves those assets from an ephemeral `127.0.0.1` HTTP port. This keeps the core Web Worker, WebAssembly files, routing, and browser storage working without `file://` URL restrictions. The listener binds only to loopback and is closed when the app exits.

The Windows installer is written under `node_modules/.cache/stremio-desktop/`.

The shell uses Electron context isolation and sandboxing, disables Node integration and webviews, denies renderer permissions by default, and opens external HTTP(S) links in the system browser. It permits the `vlc:` protocol for Stremio's Windows VLC external-player integration; all other custom schemes are blocked. It does not expose a preload bridge.

Web-app stream downloads use a native Save dialog so files go to a location the user selects. The app shows a Windows notification after a download completes.

## Stremio Service boundary

The desktop package does **not** include Stremio Service or any torrent client/runtime. Features that need the companion service require the separately installed official [Stremio Service](https://www.stremio.com/download-service). That component is maintained and distributed by Stremio; this project does not bundle, replace, or install it.

The shell adapts CORS headers only for requests from its own renderer to the official service's loopback port ranges (11470–11499 and 12470–12499). This is needed because the packaged web UI has its own ephemeral loopback origin. Remote hosts and other pages are not covered by the adapter.

## Scope

This is a standalone Windows desktop wrapper around the current web app. It does not add native media playback, offline download management, native mobile/TV clients, or OS-level protected network routing. Those capabilities require separate platform work and service contracts.
