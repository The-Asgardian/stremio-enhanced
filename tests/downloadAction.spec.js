/* global describe, test, expect */

const { getDownloadAction, isAllowedDownloadUrl } = require('../src/routes/MetaDetails/StreamsList/Stream/downloadAction');

describe('stream download action', () => {
    test('uses only the explicit direct download link and provider filename', () => {
        expect(getDownloadAction({
            player: '#/player',
            externalPlayer: {
                download: 'https://media.example.test/file?id=123',
                fileName: 'feature-film.mkv',
            },
        })).toEqual({
            href: 'https://media.example.test/file?id=123',
            fileName: 'feature-film.mkv',
        });
    });

    test('rejects playback URLs, torrent links, insecure remote links, and credential-bearing URLs', () => {
        expect(getDownloadAction({ player: 'https://media.example.test/video.mkv' })).toBeNull();
        expect(isAllowedDownloadUrl('magnet:?xt=urn:btih:example')).toBe(false);
        expect(isAllowedDownloadUrl('http://media.example.test/video.mkv')).toBe(false);
        expect(isAllowedDownloadUrl('https://user:token@media.example.test/video.mkv')).toBe(false);
    });

    test('allows the local streaming service and sanitizes filenames', () => {
        expect(getDownloadAction({
            externalPlayer: {
                download: 'http://127.0.0.1:11470/download/video',
                fileName: '../unsafe\\name.mkv',
            },
        })).toEqual({
            href: 'http://127.0.0.1:11470/download/video',
            fileName: '_unsafe_name.mkv',
        });
    });

    test('derives a filename from the direct download path when no name is supplied', () => {
        expect(getDownloadAction({
            externalPlayer: { download: 'https://media.example.test/files/movie.mkv?token=hidden' },
        })?.fileName).toBe('movie.mkv');
    });
});
