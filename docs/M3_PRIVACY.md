# M3 privacy and resilience slice

The player now limits console diagnostics to a fixed event label, an optional numeric player error code, and an optional critical flag. Provider supplied messages, stream descriptors, URLs, tokens, and stack traces are not copied into these logs. The existing player UI still receives the original error and can show Stremio's current message to the user.

This closes a local logging exposure in the browser player. It does not add source retries or alternate-source recovery, and it cannot inspect or enforce OS routing. Protected torrent mode still requires a native host or controlled service and must fail closed there before it can be offered honestly.

`tests/safePlaybackDiagnostics.spec.js` checks that sensitive error content is omitted from the diagnostic object.
