# M1 source-selection slice

The first source-selection slice adds a deterministic candidate scorer and a one-click Play action to the existing stream screen. It does not change Stremio addon requests or the shared core stream contract. All original stream cards remain available as manual overrides.

## Ranking inputs

`src/routes/MetaDetails/StreamsList/rankCandidates.js` takes an opaque candidate ID, a transient stream descriptor, and a separate `signals` object. The result returns only the ID, inferred source kind, score, rationale and rejection reasons; it never returns the original stream descriptor, so signed URLs and info hashes do not leak through the ranking result.

The scorer uses the design's starting weights:

| Signal | Weight | Current source |
| --- | ---: | --- |
| Ready status and estimated startup | 30% | Explicit adapter signals; successful local starts contribute a startup average after enough observations. |
| Reliability | 25% | Explicit adapter signal or local aggregate start success rate after enough observations. |
| Picture quality | 25% | Advertised resolution parsed from stream name/description, or explicit quality signal. |
| Throughput safety | 15% | Requires measured throughput and an explicit required bitrate. It is never inferred from file size. |
| User preference | 5% | Explicit preference match signal; profile setting is not wired yet. |

Codec and HDR labels are parsed only as advertised metadata. They become hard filters only when a device capability set is supplied. Resolution above a supplied maximum, an unavailable source, or a declared unsupported source type is rejected. Missing fields remain unknown. Ties retain provider order.

The adapter also implements `standard`, `https-only`, and `protected-torrent` policy checks. `https-only` requires an absolute HTTPS `stream.url` and rejects explicit torrent markers (a non-empty `infoHash` or a `magnet:`/`torrent:` URL), even if a descriptor declares a conflicting source kind. This checks only the initial advertised URL scheme; it does not inspect redirects, HLS/DASH manifests or segments, external-player behavior, or OS routing, and it does not provide anonymity. The current web UI uses `standard`; protected routing remains unavailable in a browser-only app per [ADR 0002](./adr/0002-privacy-enforcement.md).

## Local playback outcomes

The player records a local start success after the selected stream reaches an unpaused state, or a failure if playback errors before that point. Successful starts contribute their elapsed startup time. Browser storage is optional: storage access and quota errors are caught, and corrupt records are discarded.

Records are aggregate-only, versioned, and bounded to 100 entries. Each entry contains attempt count, successful-start count, and the running mean startup time for successful starts. The key is a non-cryptographic hash of the add-on manifest ID, broad source kind, and platform name. The raw add-on ID and stream descriptor are not stored. Stream URLs, magnet links, info hashes, tokens, titles, and provider error text are never written by this feature. This hash is for local bucketing, not a security or anonymity guarantee.

Ranking uses these history values only after at least five attempts for the same bucket; before that the history adds no score and provider order remains the tie-breaker. The observations are device-local and can be sparse, can reset when browser data is cleared, and cannot distinguish individual titles or releases from the same add-on and source kind. They do not measure buffering after startup or prove that a source is currently available.

## UI behavior

- One-click Play targets the highest-ranked launchable source for the selected addon filter.
- The visible stream list follows the rank order.
- Every source remains in the list, including candidates excluded from the one-click action, so users can override the selection.
- No silent source switch or fallback is performed. Playback failure recovery is deferred until player error/seek contracts are audited.
- The existing `StreamClicked` analytics payload was removed from on-demand and Live TV stream paths because it included the raw stream descriptor and can contain a credential-bearing URL. This optional event is no longer emitted by these screens.

## Current limits

The current Stremio `Stream` contract does not expose readiness, provider-side startup time, measured throughput, audio language, download permission, or a device capability profile. The web client now supplies a limited local signal for start success and startup time; when history is below threshold, no history signal is applied, so the existing advertised-signal ranking and provider-order tie break remain. Throughput, preference, and capability scoring require future adapters. The weight values are initial hypotheses and have not been benchmarked.

Tests use synthetic descriptors and licensed-free metadata; no copyrighted stream URLs, provider credentials, or playlist fixtures are included.
