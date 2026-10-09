# ADR 0001: Keep the upstream player abstraction for the web MVP

- **Status:** Accepted for desktop web/PWA MVP; native clients deferred
- **Date:** 2026-10-09

## Context

The current Stremio web UI delegates playback to `@stremio/stremio-video` and connects player state to the shared Stremio core. The package selects implementations per environment. The design proposes libmpv/libplacebo on desktop and Media3 on Android TV, but no candidate has been benchmarked or validated against the current UI and transport contracts. Replacing playback in the first step risks losing subtitles, seek/resume, live playback, casting, player settings, and add-on compatibility.

## Decision

Keep `@stremio/stremio-video` for the first web-based MVP. Add future candidate normalization and scoring at the UI boundary without changing the addon protocol or player contract. A native desktop or TV player is a separate adapter behind a stable playback contract and requires capability and regression tests before selection.

Do not claim `libmpv`, libplacebo, Media3, DRM, HDR, AI upscaling, or TV playback is supported by this web checkout until an implementation is built and device-tested. Inventory transitive licenses before packaging a new backend.

## Consequences

- Preserves upstream core and addon behavior while source-selection evidence is gathered.
- Supports fast baseline builds and lets desktop/mobile browsers use their current environment-specific player.
- Does not meet GPU enhancement, uniform codecs, native offline behavior, or TV-native UX requirements.
- Future adapters must report capabilities without exposing playback URLs or credentials to analytics/logs.

## Revisit when

An MVP needs a specific codec/format unavailable through the current player, or Android TV/desktop packaging requirements and target devices are selected. Compare startup latency, seek/resume, subtitles, dropped frames, memory use, HDR behavior, and licensing.
