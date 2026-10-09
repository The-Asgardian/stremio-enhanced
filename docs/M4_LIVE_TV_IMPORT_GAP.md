# M4 Live TV playlist and guide import gap

**Checked:** 2026-10-09 against the current `stremio-web` checkout.

## What already works

- The Discover EPG view requests the existing core `LiveTvGuide` model for a selected catalog, day window, and UTC offset. The model supplies channel previews and scheduled shows to the guide and channel detail screens.
- EPG providers are ordinary installed addons. `MetaDetails` detects them through `manifest.behaviorHints.epgProvider`; addon installation goes through the existing addon manifest flow and core `InstallAddon` action.
- Playback of a channel can continue through the existing channel metadata/deep-link and stream selection path.
- `M3U Playlist` in `src/common/CONSTANTS.js` is an external-player target. It opens a playlist link in a supported external app; it is not an M3U importer or an in-app playlist store.

## Missing contract

There is no web/core API in this checkout to import a user-owned M3U playlist or XMLTV guide. The Addons screen accepts an addon manifest URL and dispatches `InstallAddon`; it cannot install a playlist. The `LiveTvGuide` model only accepts a core `ResourceRequest` plus date/day/UTC-offset selection and exposes addon-provided channels and shows. It has no playlist source, parser result, XMLTV channel identifier, guide URL, or playlist-to-guide mapping input. The frontend cannot add this behavior by constructing a `LiveTvGuide` request because the core model owns the model/action protocol and state.

## Recommended next slice

Add an explicit user-owned source contract in core (or a separately versioned IPTV service), then build the web import UI on that API:

1. Define create/update/remove/list operations for a local M3U file or a playlist URL the user explicitly supplies, plus an optional XMLTV source. Keep source data scoped to the profile and make credential handling an explicit platform capability; do not put secret URLs in analytics, logs, or share links.
2. Parse and validate M3U channel IDs, names, groups, logos, and stream URLs; parse XMLTV channel IDs and programme times; expose a deterministic mapping between playlist channel IDs and guide IDs. Reject malformed and unsupported input with actionable errors.
3. Adapt normalized channels and programmes to the existing `EPGChannel` / `EPGProgram` view boundary and channel deep-link/playback path, keeping addon-supplied `LiveTvGuide` behavior intact.
4. Cover parser limits, malformed input, time zones, duplicate IDs, mapping, URL handling, and profile persistence with fixture-based tests. Fixtures should be synthetic or explicitly licensed; no provider list is bundled.

The frontend integration point is clear after that contract exists: a user-owned guide/source selector alongside the existing EPG catalog selection in Discover, feeding the same Guide component. Until then, adding an import button would accept data that the app has nowhere safe or compatible to store, parse, map, or play.
