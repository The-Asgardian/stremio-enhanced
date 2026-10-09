# ADR: Windows desktop host

**Status:** local proof of concept; Windows x64 target

## Decision

Wrap the current responsive Stremio Enhanced web app in Electron for a standalone Windows window, and package the production web assets beside the shell. Serve the assets from an ephemeral loopback HTTP origin so the core worker, WASM, and browser storage retain normal browser semantics.

## Why this host

The upstream Qt shell has a GPL-3.0 licensing boundary that needs a compatibility review against this repository's GPL-2.0 license before reuse. The newer `shell-ng` path is Windows-specific and its distribution/license status was not clear in the existing platform audit. Electron provides a working local desktop target using the existing web UI, with context isolation and renderer sandboxing.

## Limits

Electron is a web application host, not a native media/player implementation. Playback support and device integration remain bounded by Chromium and the existing web app. This proof targets Windows x64; it does not claim macOS/Linux packages or mobile/TV clients. Features that require Stremio Service still need the separately installed official companion; its binaries and torrent runtime are not included here.

## Packaging

`pnpm desktop:dev` connects to a running local webpack dev server. `pnpm desktop:pack` builds the web assets with service-worker registration disabled and produces a Windows NSIS installer under `node_modules/.cache/stremio-desktop/`. The app package metadata lives in this directory so packaging does not treat the web application's large dependency tree as Electron main-process dependencies.
