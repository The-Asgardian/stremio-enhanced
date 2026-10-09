# Upstream audit

**Checked:** 2026-10-09  
**Checkout:** `Stremio/stremio-web`, branch `development`, commit `21c8a53b026a85745e60203d94786835782277f4`  
**Local downstream branch:** `stremio-enhanced`; remote `upstream` points to `https://github.com/Stremio/stremio-web.git`.

## Repositories and licences

| Project | Role | Licence / status |
| --- | --- | --- |
| [stremio-web](https://github.com/Stremio/stremio-web) | React UI and PWA; runs shared core through the WASM package and routes playback through `@stremio/stremio-video`. | GPL-2.0. This checkout retains upstream `LICENSE.md`. Distribution of modified binaries must meet GPL source and notice requirements. |
| [stremio-core](https://github.com/Stremio/stremio-core) | Rust shared engine: addon transport and types, library, player state, profile, and app models. | MIT. The web app consumes its published `@stremio/stremio-core-web` bridge; core is not vendored in this checkout. |
| [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk) | Reference SDK and documentation for the HTTP addon protocol. | MIT. No SDK code is vendored here. |
| [stremio-video](https://www.npmjs.com/package/@stremio/stremio-video) | Existing player abstraction selected by the web UI for the active environment. | Separate package and licence inventory is required before redistribution or native integration. |

## Actual addon and stream surface

Addons advertise resources and supported types in a manifest. The protocol exposes catalog, metadata, stream and subtitle requests; stream resolution remains an addon response, not a provider-specific contract. The web app's shared `Stream` type currently has optional `ytId`, `infoHash`, `fileIdx`, `url`, `externalUrl` and deep links, plus `name` and `description` (`src/core/types/Stream.d.ts`). It does not define resolution, codecs, HDR, audio languages, measured throughput, cache readiness, availability timestamp, startup time, provider trust, or download permission.

`MetaDetails/StreamsList/StreamsList.js` consumes the core's per-addon stream states, groups ready results by addon, and displays them. It does not rank or auto-play a best candidate. The selected stream is encoded into a player deep link; `Player/usePlayer.js` decodes it and loads the core Player model. Addon stream fields are user/provider-supplied data, so any future normalizer must treat them as untrusted and avoid logging encoded playback descriptors.

The SDK protocol documents HTTP(S) resources and stream representations; current core supports modern HTTP(S) JSON plus a legacy JSON-RPC adapter. The compatibility policy should therefore add an adapter at the candidate boundary and preserve upstream request/response semantics.

## Existing platform and feature coverage

| Target | Existing baseline | Audit conclusion |
| --- | --- | --- |
| Desktop PC | Browser/PWA frontend; Stremio desktop shell can provide platform services; `stremio-video` chooses an environment-specific player. | Strongest near-term fit. Web build alone does not prove a standalone Windows/Linux installable package. |
| Mobile | Installable PWA; responsive UI paths and platform detection; web playback depends on browser capabilities. | Useful baseline for Android/iOS, but offline media, OS keychain use, background downloads and native player parity need a native bridge/app. |
| TV | Gamepad/navigation hooks and web EPG/Live TV UI are present in this checkout; web UI has no audited native TV packaging or TV-specific player backend here. | A browser deployment may work on some TVs but is not a supported substitute for an Android TV/Google TV client. Remote focus, text entry, performance and codec support need device validation. |

Native EPG and Live TV UI are already in upstream web, so the design's IPTV milestone should begin with a gap audit and authorized playlist/EPG ingestion rather than reimplementing guide display. The SDK documents native EPG. No licensed stream list or media fixtures are included.

## Build and test baseline

Requirements from the checked out `package.json`: Node.js >=22 and pnpm >=11 (package manager pin 11.8.0). Verified on this machine with Node `v24.9.0` and pnpm `11.8.0`:

```powershell
pnpm install --frozen-lockfile
pnpm run build
pnpm test -- --runInBand
```

Dependency installation succeeded. The production webpack build succeeded with size warnings: initial `main.js` is about 9.08 MiB, the main entrypoint about 9.4 MiB, and the worker/core WASM about 4.88 MiB; webpack also reports a generated 8.07 MiB chunk. Treat these as baseline measurements, not performance targets. The existing test suite passed (3 suites, 70 tests).

Other upstream commands are `pnpm start`, `pnpm run lint`, and `pnpm run scan-translations`. For product changes, run the relevant checks and `git diff --check`. Do not claim an OS/device is supported solely because the web build succeeds.

## Decisions and open questions

1. Keep Stremio core, addon protocol and video abstraction intact while proving the first source-selection layer.
2. Desktop web/PWA is the first development target. Mobile remains browser/PWA until an explicit native bridge decision. Android TV is a separate client milestone, with a native player likely required.
3. Browser code cannot enforce a torrent kill switch, inspect OS routes, securely store secrets in a platform keychain by itself, or guarantee native codec support. A protected-torrent mode must fail closed in a controlled native/service layer; it is not an honest web-only feature.
4. Candidate scoring cannot responsibly use the design's proposed readiness, startup, reliability, codec/HDR, throughput and permission dimensions until the source adapter or player produces those signals. Missing values must remain unknown, not be guessed from filename or file size.
5. Provider support, legal permissions, desktop shell, mobile packaging, and TV platforms remain open. No debrid/torrent/IPTV provider or unauthorized content source is selected by this audit.

## Upstream references

- [stremio-web README and setup](https://github.com/Stremio/stremio-web)
- [stremio-core README, architecture and development commands](https://github.com/Stremio/stremio-core)
- [addon SDK protocol](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/protocol.md)
- [addon manifest format](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md)
- [addon stream response](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/stream.md)
- [addon SDK Native EPG example/docs](https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/epg.md)
