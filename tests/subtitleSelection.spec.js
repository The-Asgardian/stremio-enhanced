/* global describe, test, expect */

const {
    buildSubtitleCandidates,
    normalizeSubtitleLanguage,
    resolveBestSubtitleCandidate,
} = require('../src/routes/Player/subtitleSelection');

describe('automatic subtitle selection', () => {
    test('normalizes a preferred language and ranks it across embedded and add-on tracks', () => {
        const candidates = buildSubtitleCandidates(null, null, 'fr');
        const selected = resolveBestSubtitleCandidate(candidates, [
            { id: 'embedded-en', lang: 'eng' },
        ], [
            { id: 'addon-fr', lang: 'fra' },
        ]);

        expect(normalizeSubtitleLanguage('fr')).toBe('fra');
        expect(selected).toEqual({
            source: 'external',
            rank: 1,
            track: { id: 'addon-fr', lang: 'fra' },
        });
    });

    test('uses the default subtitle language when the user enables subtitles without choosing one', () => {
        const candidates = buildSubtitleCandidates({ enabled: true }, null, null);
        const selected = resolveBestSubtitleCandidate(candidates, [
            { id: 'embedded-en', lang: 'eng' },
        ], []);

        expect(selected?.track.id).toBe('embedded-en');
        expect(candidates[0]).toEqual({ source: 'embedded', language: 'eng' });
    });

    test('keeps a saved track ahead of language fallbacks when it still exists', () => {
        const candidates = buildSubtitleCandidates(null, {
            id: 'saved-track',
            embedded: false,
            language: 'spa',
        }, 'French');
        const selected = resolveBestSubtitleCandidate(candidates, [], [
            { id: 'saved-track', lang: 'spa' },
            { id: 'french-track', lang: 'fra' },
        ]);

        expect(selected?.track.id).toBe('saved-track');
    });
});
