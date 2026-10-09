/* global describe, test, expect */

const { toSafePlaybackDiagnostic } = require('../src/routes/Player/safePlaybackDiagnostics');

describe('safe playback diagnostics', () => {
    test('keeps only stable non-sensitive error fields', () => {
        const result = toSafePlaybackDiagnostic({
            code: 2,
            critical: true,
            message: 'Failed to load https://provider.example/video?token=secret-token',
            stream: { url: 'https://provider.example/video?token=secret-token', infoHash: 'secret-hash' },
        });

        expect(result).toEqual({ kind: 'playback-error', code: 2, critical: true });
        expect(JSON.stringify(result)).not.toMatch(/secret|provider\.example/);
    });

    test('handles unknown and malformed errors without copying their contents', () => {
        expect(toSafePlaybackDiagnostic(new Error('https://provider.example/private')))
            .toEqual({ kind: 'playback-error' });
        expect(toSafePlaybackDiagnostic(null)).toEqual({ kind: 'playback-error' });
    });
});
