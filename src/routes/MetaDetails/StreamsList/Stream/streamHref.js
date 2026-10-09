const getStreamHref = (deepLinks, platformName, playerType) => {
    if (!deepLinks) return null;

    const playerHref = deepLinks.player || null;
    const externalPlayer = deepLinks.externalPlayer;
    if (!externalPlayer || !playerType) return playerHref;

    if (playerType === 'm3u') {
        return externalPlayer.playlist || playerHref;
    }

    if (externalPlayer.web) return externalPlayer.web;

    return externalPlayer.openPlayer?.[platformName] || playerHref;
};

const isM3UPlaylistLink = (href, deepLinks, playerType) => (
    playerType === 'm3u' &&
    typeof href === 'string' &&
    href === deepLinks?.externalPlayer?.playlist
);

module.exports = { getStreamHref, isM3UPlaylistLink };
