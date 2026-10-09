# M2 Home experience slice

The Home board now opens with a cinematic featured-title panel built from the first ready movie or series catalog item that has artwork and a valid Stremio deep link. It uses addon metadata and artwork already loaded by the existing board model; it adds no new recommendation service, ranking claim, or external request.

The primary action opens the player only when the item already provides a direct player link. Otherwise it opens the title details page. When both routes exist, a second details action is available. Existing catalog rails and Continue Watching remain in their current order below the hero.

The panel uses an original dark gradient treatment, responsive type and spacing, touch-sized buttons, visible keyboard/gamepad focus, and reduced-motion support. It does not reproduce another service's exact branding, artwork treatment, or navigation.

The desktop sidebar now keeps its tab labels visible, calls the root destination Home, and shows a clear focus ring during keyboard or remote navigation.

Home also shows compact Movie and Series shortcuts when the loaded catalogs provide those types and valid Discover deep links. The shortcut destinations come from the actual installed catalog model; a missing type or route stays hidden. The chips scroll horizontally on narrow screens and have keyboard focus styling. `tests/categoryShortcuts.spec.js` covers real links and omitted or missing catalog options.

`tests/featuredMetaItem.spec.js` verifies selection from ready movie/series catalogs and ignores missing, empty, malformed, or unrouteable entries. The desktop and narrow-window layout were reviewed in the local web build. Native mobile and TV package validation remains separate work.
