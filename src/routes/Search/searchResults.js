const getSearchResultState = (catalogs) => {
    if (!Array.isArray(catalogs) || catalogs.length === 0) {
        return 'no-catalogs';
    }

    const settled = catalogs.every(({ content }) => content?.type === 'Ready' || content?.type === 'Err');
    if (!settled) {
        return 'loading';
    }

    const hasResults = catalogs.some(({ content }) => content?.type === 'Ready' && Array.isArray(content.content) && content.content.length > 0);
    if (hasResults) {
        return 'results';
    }

    const hasRequestErrors = catalogs.some(({ content }) => content?.type === 'Err' && content.content !== 'EmptyContent');
    return hasRequestErrors ? 'errors' : 'empty';
};

module.exports = {
    getSearchResultState,
};
