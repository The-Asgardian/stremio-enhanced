# M6 remote and TV navigation

The web client now gives keyboard users a high contrast focus ring and gives gamepad focused controls a persistent white ring with an accent halo. The gamepad candidate list skips controls that are disabled, hidden, or outside the visible layout. Directional movement favors controls in the same visual row or column, and focus stays at the edge instead of wrapping to an unrelated item. Pointer interaction clears the gamepad marker.

The controller guide modal can receive directional focus and activate its Close button. When an overlay closes after controller activation, focus returns to the control that opened it.

This improves remote and gamepad use in a browser running on a TV device. It does not package the app as Android TV, Google TV, Fire TV, or another native TV client. A native release still needs a selected platform, native playback integration, platform packaging, and device testing with actual remotes and focus/overscan settings.

`tests/spatialNavigation.spec.js` covers row preference, directional edge behavior, and initial focus selection. The geometry policy is shared by the custom gamepad path; browser keyboard arrows continue to use the installed spatial-navigation polyfill.
