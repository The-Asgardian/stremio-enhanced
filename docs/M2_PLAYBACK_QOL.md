# M2 playback quality of life

## Automatic subtitles

The player already receives embedded subtitle tracks and subtitle-addon tracks through Stremio core. The selection policy is now isolated and covered by deterministic tests: a saved track is preferred while available, the profile's preferred subtitle language is matched across embedded and add-on tracks, and enabling subtitles without a session language falls back to the existing default subtitle language. A user's explicit subtitle-off preference still disables selection. This does not introduce a new subtitle provider or change the addon protocol.

## Source-provided downloads

The recommended source now shows a Play and Download pair when a stream explicitly supplies `deepLinks.externalPlayer.download`; the per-source context menu also offers Download for manual choices. The action accepts HTTPS URLs and HTTP URLs on localhost for the local streaming service; it ignores playback links, torrent/magnet links, remote HTTP, and credential-bearing URLs. Suggested filenames are sanitized before they reach the browser's download attribute. The user still needs to follow the source provider's terms and download permissions.

The current web/core contract has no download permission field, managed queue, pause/resume API, storage quota, or offline library model. The streams screen keeps an informational list of up to ten direct-download requests in memory for the current screen session. It records only the suggested filename, title, and request time; it does not retain the URL, persist entries, inspect or buffer media, or claim provider permission or completion. The browser or local service handles the transfer. Background downloads and offline playback require a service/native host, storage lifecycle, and an explicit permission/capability contract.
