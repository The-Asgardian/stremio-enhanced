const { describe, expect, test } = require('@jest/globals');
const {
    MAX_ENTRIES,
    STORAGE_KEY,
    createOutcomeKey,
    getPlaybackOutcome,
    parseHistory,
    readPlaybackOutcomeHistory,
    recordPlaybackOutcome,
    toRankingSignals,
} = require('../src/routes/Player/playbackOutcomeHistory');

const createStorage = (initial = null) => {
    let value = initial;
    return {
        getItem: () => value,
        setItem: (key, nextValue) => {
            if (key !== STORAGE_KEY) throw new Error('unexpected key');
            value = nextValue;
        },
        value: () => value,
    };
};

describe('local playback outcome history', () => {
    const identity = { addonId: 'org.example.provider', platform: 'web', kind: 'hls' };

    test('aggregates only bounded outcome counts and successful startup averages', () => {
        const storage = createStorage();
        expect(recordPlaybackOutcome({ ...identity, outcome: 'success', startupMs: 1500 }, storage)).toBe(true);
        expect(recordPlaybackOutcome({ ...identity, outcome: 'failure' }, storage)).toBe(true);
        expect(recordPlaybackOutcome({ ...identity, outcome: 'success', startupMs: 2500 }, storage)).toBe(true);

        expect(getPlaybackOutcome(identity, storage)).toEqual({ attempts: 3, successes: 2, startupMs: 2000 });
        const saved = storage.value();
        expect(saved).not.toContain(identity.addonId);
        expect(saved).not.toContain('token');
        expect(saved).not.toContain('infoHash');
    });

    test('keys outcomes by addon, platform, and broad source kind', () => {
        const baseKey = createOutcomeKey(identity);
        expect(createOutcomeKey({ ...identity, platform: 'android' })).not.toBe(baseKey);
        expect(createOutcomeKey({ ...identity, kind: 'dash' })).not.toBe(baseKey);
        expect(createOutcomeKey({ ...identity, addonId: 'org.example.other' })).not.toBe(baseKey);
        expect(createOutcomeKey({ ...identity, addonId: 'x'.repeat(257) })).toBeNull();
    });

    test('does not produce ranking signals until the observation threshold is met', () => {
        expect(toRankingSignals({ attempts: 4, successes: 4, startupMs: 100 })).toBeNull();
        expect(toRankingSignals({ attempts: 5, successes: 4, startupMs: 1500 })).toEqual({
            reliabilityScore: 0.8,
            estimatedStartupMs: 1500,
        });
        expect(toRankingSignals({ attempts: 5, successes: 0, startupMs: 0 })).toEqual({ reliabilityScore: 0 });
    });

    test('drops malformed, oversized, and descriptor-shaped persisted values', () => {
        const entries = Object.fromEntries(Array.from({ length: MAX_ENTRIES + 10 }, (_, index) => [
            index.toString(16).padStart(8, '0'),
            { attempts: 5, successes: 4, startupMs: 500, url: 'https://secret.test/?token=secret' },
        ]));
        entries.bad = { attempts: 1, successes: 2, startupMs: 10 };
        const history = parseHistory({ version: 1, entries });

        expect(Object.keys(history)).toHaveLength(MAX_ENTRIES);
        expect(history['00000000']).toEqual({ attempts: 5, successes: 4, startupMs: 500 });
        expect(JSON.stringify(history)).not.toContain('secret');
    });

    test('handles unavailable, throwing, or corrupt storage without breaking playback', () => {
        expect(readPlaybackOutcomeHistory({ getItem: () => { throw new Error('blocked'); } })).toEqual({});
        expect(recordPlaybackOutcome({ ...identity, outcome: 'success', startupMs: 100 }, {
            getItem: () => null,
            setItem: () => { throw new Error('quota'); },
        })).toBe(false);
        expect(readPlaybackOutcomeHistory(createStorage('{bad json'))).toEqual({});
        expect(recordPlaybackOutcome({ ...identity, outcome: 'failure' }, null)).toBe(false);
    });
});
