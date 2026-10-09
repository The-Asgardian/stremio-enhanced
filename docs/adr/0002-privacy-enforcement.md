# ADR 0002: Defer protected-torrent enforcement to a native routing boundary

- **Status:** Accepted; protected-torrent mode is not available in the web MVP
- **Date:** 2026-10-09

## Context

The design requires that a privacy-required torrent route prevent peer traffic on direct routes and fail closed if the protected route disappears. This checkout is a browser/PWA UI. It cannot reliably control OS firewall rules, network interfaces, DNS/IPv6 routes, or stop peer traffic after an OS routing change. A UI toggle would not meet the stated safety property.

## Decision

Do not implement or advertise protected-torrent mode in browser code. The web MVP may offer clear source-type visibility and can exclude torrent candidates when the user chooses HTTPS-only, but it cannot promise route enforcement. Protected torrent operation requires a separately audited native service with OS-level route verification and fail-closed peer gating.

Never label a route or product mode "anonymous." Keep playback descriptors and credentials out of logs, analytics, screenshots, and unencrypted history. Any source history should use opaque provider/source IDs and be opt-in or locally retained.

## Consequences

- Avoids a false guarantee that a browser cannot enforce.
- Privacy-required torrent functionality is deferred until a native service exists on a selected OS and passes route-loss/leak tests.
- HTTPS-only filtering can be implemented as a candidate policy, but it is not a network kill switch.
- OS keychain integration also requires a native host or secure platform bridge; browser local storage is not an equivalent.

## Revisit when

A Windows/Linux native host is selected and a threat model, supported VPN/routing model, DNS/IPv6 strategy, and automated leak-test environment are available.
