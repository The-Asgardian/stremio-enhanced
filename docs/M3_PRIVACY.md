# M3 privacy and resilience slice

The player now limits console diagnostics to a fixed event label, an optional numeric player error code, and an optional critical flag. Provider supplied messages, stream descriptors, URLs, tokens, and stack traces are not copied into these logs. The existing player UI still receives the original error and can show Stremio's current message to the user.

This closes a local logging exposure in the browser player. It does not add source retries or alternate-source recovery, and it cannot inspect or enforce OS routing. Protected torrent mode still requires a native host or controlled service and must fail closed there before it can be offered honestly.

The source-ranking adapter's `https-only` policy is a separate scheme check. It requires an absolute HTTPS `stream.url` and rejects explicit torrent markers, including a non-empty `infoHash`, even when the add-on declares another source kind. It does not validate redirects, HLS/DASH manifests or segments, external-player resolution, or the route used by a native player. HTTPS-only therefore describes the advertised initial endpoint and is not a guarantee of end-to-end privacy or anonymity.

`tests/safePlaybackDiagnostics.spec.js` checks that sensitive error content is omitted from the diagnostic object.

The Streaming settings page also has a browser-local “Recommend HTTPS sources only” preference. It stores exactly one boolean string at `stremio.enhanced.sourcePrivacy.httpsOnly.v1` in `localStorage`; it is off by default, and unavailable or blocked storage leaves recommendations permissive. The preference filters one-click recommendations only. Users can still manually play listed sources. It does not secure network routes, affect other browser profiles/devices, or alter add-on data or the Stremio account profile. The ranking caller can read it through `readRecommendHttpsSourcesOnly()` from `src/routes/Settings/Streaming/sourcePrivacyPreference.js`; writes use `writeRecommendHttpsSourcesOnly(enabled)` and return false when persistence is unavailable.
