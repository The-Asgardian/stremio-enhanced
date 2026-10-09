# Platform host audit

**Checked:** 2026-10-09 against the official Stremio GitHub repositories.

The current fork is the Stremio Web React/PWA application. Its production build does not create a native desktop installer or Android/iOS/TV package.

## Desktop candidates

| Host | Verified fit | Open issue |
| --- | --- | --- |
| `stremio-shell` | Existing Qt5 desktop shell; its README documents Windows, macOS and Linux builds and a `--webui-url` argument for loading a custom web UI. The repository declares GPL-3.0. | The web fork declares GPL-2.0. Distribution compatibility and a full bundled-dependency licence review are required before adopting or bundling this host. |
| `stremio-shell-ng` | Official Rust shell using WebView2 and mpv; its README describes it as Windows-only. | It does not cover Linux/macOS. The public repo page does not declare a licence, so inspect the exact code revision and dependencies before integration or distribution. Its documented web UI handshake and service contracts also need an adapter audit. |
| Browser/PWA | Works with the existing web app on desktop browsers without a new native host. | Does not provide a standalone installer, native player parity, OS route enforcement or keychain integration. |

References: [stremio-shell README and arguments](https://github.com/Stremio/stremio-shell#readme), [stremio-shell licence](https://github.com/Stremio/stremio-shell/blob/master/LICENSE.md), and [stremio-shell-ng README](https://github.com/Stremio/stremio-shell-ng#readme).

## Platform consequence

The design's provisional Windows/Linux desktop-first scope cannot be met by `stremio-shell-ng` alone. The older shell has broader OS coverage and accepts a custom UI URL, but its GPL-3.0 declaration needs compatibility review against this fork before distribution. A Windows-only proof of concept is the narrowest native step; a cross-platform desktop release needs an explicitly selected host strategy.

Mobile and TV remain separate packaging decisions. The web/PWA can be used as a responsive browser client, but that does not establish native Android/iOS or Android TV/Google TV support. Native TV work needs a target platform, player and remote-navigation validation plan.

No shell repository or binary is vendored by this audit.
# Desktop implementation update (2026-10-09)

The repository now has a local Windows x64 Electron proof of concept under `apps/desktop`. It reuses the responsive web app and serves production assets over loopback HTTP for worker/WASM compatibility. See [the desktop ADR](../apps/desktop/ADR.md) for the host rationale, security settings, commands, and known limits. This is a Windows-first desktop target, not a cross-platform desktop completion claim. Native mobile/TV packages and a native player remain future work. Stremio Service remains a separately installed official companion and is not bundled.

The upstream Qt shell reuse question remains open pending a GPL-3.0 versus this repository's GPL-2.0 compatibility review. The license/distribution status of `shell-ng` remains unresolved.
