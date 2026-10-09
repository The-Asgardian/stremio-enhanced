/* global describe, test, expect */

const {
    SOURCE_PRIVACY_PREFERENCE_KEY,
    readRecommendHttpsSourcesOnly,
    writeRecommendHttpsSourcesOnly,
} = require('../src/routes/Settings/Streaming/sourcePrivacyPreference');

describe('browser source privacy preference', () => {
    test('defaults to permissive recommendations and stores only a boolean value', () => {
        const values = new Map();
        const storage = {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
        };

        expect(readRecommendHttpsSourcesOnly(storage)).toBe(false);
        expect(writeRecommendHttpsSourcesOnly(true, storage)).toBe(true);
        expect(values.size).toBe(1);
        expect([...values.entries()]).toEqual([[SOURCE_PRIVACY_PREFERENCE_KEY, 'true']]);
        expect(readRecommendHttpsSourcesOnly(storage)).toBe(true);
        expect(writeRecommendHttpsSourcesOnly(false, storage)).toBe(true);
        expect(readRecommendHttpsSourcesOnly(storage)).toBe(false);
    });

    test('uses permissive mode when storage is missing or unavailable', () => {
        const throwingStorage = {
            getItem: () => { throw new Error('blocked'); },
            setItem: () => { throw new Error('blocked'); },
        };

        expect(readRecommendHttpsSourcesOnly(null)).toBe(false);
        expect(readRecommendHttpsSourcesOnly(throwingStorage)).toBe(false);
        expect(writeRecommendHttpsSourcesOnly(true, null)).toBe(false);
        expect(writeRecommendHttpsSourcesOnly(true, throwingStorage)).toBe(false);
    });

    test('accepts only a boolean write request and exact true storage value', () => {
        const values = new Map([[SOURCE_PRIVACY_PREFERENCE_KEY, '1']]);
        const storage = {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value),
        };

        expect(readRecommendHttpsSourcesOnly(storage)).toBe(false);
        expect(writeRecommendHttpsSourcesOnly('true', storage)).toBe(false);
        expect(values.get(SOURCE_PRIVACY_PREFERENCE_KEY)).toBe('1');
    });
});
