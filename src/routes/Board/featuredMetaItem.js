const getFeaturedMetaItem = (catalogRows) => {
    if (!Array.isArray(catalogRows)) {
        return null;
    }

    for (const row of catalogRows) {
        const content = row?.catalog?.content;
        if (content?.type !== 'Ready' || !Array.isArray(content.content)) {
            continue;
        }

        const item = content.content.find((candidate) => candidate && typeof candidate === 'object' &&
            (candidate.type === 'movie' || candidate.type === 'series') &&
            typeof candidate.name === 'string' && candidate.name.length > 0 &&
            ((typeof candidate.background === 'string' && candidate.background.length > 0) || (typeof candidate.poster === 'string' && candidate.poster.length > 0)) &&
            (typeof candidate.deepLinks?.player === 'string' || typeof candidate.deepLinks?.metaDetailsStreams === 'string' || typeof candidate.deepLinks?.metaDetailsVideos === 'string')
        );

        if (item) {
            return item;
        }
    }

    return null;
};

module.exports = getFeaturedMetaItem;
