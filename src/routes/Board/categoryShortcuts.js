const getCategoryShortcuts = (catalogRows) => {
    if (!Array.isArray(catalogRows)) {
        return [];
    }

    return ['movie', 'series'].reduce((shortcuts, type) => {
        const catalog = catalogRows
            .map((row) => row?.catalog)
            .find((candidate) => candidate?.type === type && typeof candidate.deepLinks?.discover === 'string');

        if (catalog) {
            shortcuts.push({ type, href: catalog.deepLinks.discover });
        }

        return shortcuts;
    }, []);
};

module.exports = getCategoryShortcuts;
