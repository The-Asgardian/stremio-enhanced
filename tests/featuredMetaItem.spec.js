/* global describe, test, expect */

const getFeaturedMetaItem = require('../src/routes/Board/featuredMetaItem');

describe('featured board title', () => {
    test('selects the first ready title with usable artwork and a details route', () => {
        const featured = { type: 'movie', name: 'Featured', background: 'https://example.test/backdrop.jpg', deepLinks: { metaDetailsStreams: '#/details' } };
        expect(getFeaturedMetaItem([
            { catalog: { content: { type: 'Loading' } } },
            { catalog: { content: { type: 'Ready', content: [featured] } } },
        ])).toBe(featured);
    });

    test('skips empty, incomplete, and unrouteable catalog entries', () => {
        expect(getFeaturedMetaItem([
            null,
            { catalog: { content: { type: 'Ready', content: [] } } },
            { catalog: { content: { type: 'Ready', content: [null, { type: 'movie', name: 'No artwork', deepLinks: { player: '#/play' } }] } } },
            { catalog: { content: { type: 'Ready', content: [{ type: 'movie', name: 'No route', poster: 'poster.jpg' }] } } },
        ])).toBeNull();
    });

    test('does not assume a catalog list exists', () => {
        expect(getFeaturedMetaItem(null)).toBeNull();
    });
});
