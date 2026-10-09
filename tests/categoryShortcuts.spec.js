/* global describe, test, expect */

const getCategoryShortcuts = require('../src/routes/Board/categoryShortcuts');

describe('board category shortcuts', () => {
    test('uses real movie and series catalog deep links', () => {
        expect(getCategoryShortcuts([
            { catalog: { type: 'movie', deepLinks: { discover: '#/discover/movie-catalog' } } },
            { catalog: { type: 'series', deepLinks: { discover: '#/discover/series-catalog' } } },
        ])).toEqual([
            { type: 'movie', href: '#/discover/movie-catalog' },
            { type: 'series', href: '#/discover/series-catalog' },
        ]);
    });

    test('skips unavailable types and catalogs without a discover link', () => {
        expect(getCategoryShortcuts([
            { catalog: { type: 'movie' } },
            { catalog: { type: 'channel', deepLinks: { discover: '#/discover/live' } } },
        ])).toEqual([]);
    });

    test('handles a missing catalog list', () => {
        expect(getCategoryShortcuts(null)).toEqual([]);
    });
});
