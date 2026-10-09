# M2 discovery slice

The search route now handles completed empty addon catalogs safely and distinguishes a genuine no-results response from loading, missing addons, and provider errors. This prevents the old empty-catalog path from trying to read a poster shape from an empty array.

When a search finishes with no results, the route surfaces up to three suggestions from Stremio's existing local-search model. That engine runs locally in WASM and uses title autocomplete, tf-idf and edit-distance signals. Suggestions are plain focusable links, so they work with touch, keyboard, and the existing spatial/gamepad navigation. Choosing one starts the normal Stremio addon search for that suggestion; no backend or external search service is added.

The existing responsive navigation shell, search bar, catalog rows, details, library, settings, and gamepad focus hooks remain the UI foundation for this slice. This does not add a new TV-native package, person/character index, semantic search service, or alternate home-page design. Addon-provided people/catalog search continues through the existing protocol.

`tests/searchResults.spec.js` covers loading, empty results, successful results, provider errors and the no-catalog state.
