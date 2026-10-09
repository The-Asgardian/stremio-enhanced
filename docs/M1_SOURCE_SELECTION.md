# M1 source-selection slice

The first source-selection slice adds a deterministic candidate scorer and a one-click Play action to the existing stream screen. It does not change Stremio addon requests or the shared core stream contract. All original stream cards remain available as manual overrides.

## Ranking inputs

`src/routes/MetaDetails/StreamsList/rankCandidates.js` takes an opaque candidate ID, a transient stream descriptor, and a separate `signals` object. The result returns only the ID, inferred source kind, score, rationale and rejection reasons; it never returns the original stream descriptor, so signed URLs and info hashes do not leak through the ranking result.

The scorer uses the design's starting weights:

| Signal | Weight | Current source |
| --- | ---: | --- |
| Ready status and estimated startup | 30% | Explicit adapter signals only; not present in the upstream stream contract yet. |
| Reliability | 25% | Explicit adapter signal only; no health history is collected yet. |
| Picture quality | 25% | Advertised resolution parsed from stream name/description, or explicit quality signal. |
| Throughput safety | 15% | Requires measured throughput and an explicit required bitrate. It is never inferred from file size. |
| User preference | 5% | Explicit preference match signal; profile setting is not wired yet. |

Codec and HDR labels are parsed only as advertised metadata. They become hard filters only when a device capability set is supplied. Resolution above a supplied maximum, an unavailable source, or a declared unsupported source type is rejected. Missing fields remain unknown. Ties retain provider order.

The adapter also implements `standard`, `https-only`, and `protected-torrent` policy checks. The current web UI uses `standard`; protected routing remains unavailable in a browser-only app per [ADR 0002](./adr/0002-privacy-enforcement.md).

## UI behavior

- One-click Play targets the highest-ranked launchable source for the selected addon filter.
- The visible stream list follows the rank order.
- Every source remains in the list, including candidates excluded from the one-click action, so users can override the selection.
- No silent source switch or fallback is performed. Playback failure recovery is deferred until player error/seek contracts are audited.
- The existing `StreamClicked` analytics payload was removed from on-demand and Live TV stream paths because it included the raw stream descriptor and can contain a credential-bearing URL. This optional event is no longer emitted by these screens.

## Current limits

The current Stremio `Stream` contract does not expose readiness, startup time, reliability, measured throughput, audio language, download permission, or a device capability profile. Therefore the real UI ranking can currently use advertised resolution and launchability, then preserve upstream order for ties. Readiness, reliability, throughput, preference, and capability scoring become effective when local player/provider adapters supply those signals. The weight values are initial hypotheses and have not been benchmarked.

Tests use synthetic descriptors and licensed-free metadata; no copyrighted stream URLs, provider credentials, or playlist fixtures are included.
