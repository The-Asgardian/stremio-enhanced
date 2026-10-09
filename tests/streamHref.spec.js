/* global describe, test, expect */

const { getStreamHref, isM3UPlaylistLink } = require('../src/routes/MetaDetails/StreamsList/Stream/streamHref');

describe('stream playback links', () => {
    const deepLinks = {
        player: '#/player/stream-id',
        externalPlayer: {
            playlist: 'https://media.example.test/playlist.m3u',
            fileName: 'playlist.m3u',
            openPlayer: { windows: 'vlc://play?url=https%3A%2F%2Fmedia.example.test%2Fvideo.mp4' },
        },
    };

    test('uses the built-in player when external playback is disabled', () => {
        expect(getStreamHref(deepLinks, 'windows', null)).toBe('#/player/stream-id');
        expect(isM3UPlaylistLink('#/player/stream-id', deepLinks, null)).toBe(false);
    });

    test('uses an explicitly selected M3U playlist as a download', () => {
        const href = getStreamHref(deepLinks, 'windows', 'm3u');
        expect(href).toBe('https://media.example.test/playlist.m3u');
        expect(isM3UPlaylistLink(href, deepLinks, 'm3u')).toBe(true);
    });

    test('uses the platform-specific native player link when available', () => {
        const href = getStreamHref(deepLinks, 'windows', 'vlc');
        expect(href).toBe('vlc://play?url=https%3A%2F%2Fmedia.example.test%2Fvideo.mp4');
        expect(isM3UPlaylistLink(href, deepLinks, 'vlc')).toBe(false);
    });

    test('falls back to in-app playback when the chosen external player has no matching link', () => {
        expect(getStreamHref(deepLinks, 'linux', 'vlc')).toBe('#/player/stream-id');
    });
});
