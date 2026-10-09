const { getSearchResultState } = require('../src/routes/Search/searchResults');

describe('search result state', () => {
    test('waits for all catalog requests to settle', () => {
        expect(getSearchResultState([
            { content: { type: 'Ready', content: [] } },
            { content: { type: 'Loading' } },
        ])).toBe('loading');
    });

    test('identifies a completed search with no results', () => {
        expect(getSearchResultState([
            { content: { type: 'Ready', content: [] } },
            { content: { type: 'Err', content: 'EmptyContent' } },
        ])).toBe('empty');
    });

    test('distinguishes results and request errors from a genuine empty search', () => {
        expect(getSearchResultState([
            { content: { type: 'Ready', content: [{ id: 'synthetic-title' }] } },
            { content: { type: 'Err', content: 'ProviderError' } },
        ])).toBe('results');
        expect(getSearchResultState([
            { content: { type: 'Err', content: 'ProviderError' } },
        ])).toBe('errors');
    });

    test('distinguishes an empty catalog set', () => {
        expect(getSearchResultState([])).toBe('no-catalogs');
    });
});
