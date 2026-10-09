/* global describe, test, expect */

const { MAX_RECENT_DOWNLOADS, createDownloadQueueEntry, addDownloadQueueEntry } = require('../src/routes/MetaDetails/StreamsList/downloadQueue');

describe('local download list', () => {
    test('creates entries only for explicitly allowed direct download URLs', () => {
        expect(createDownloadQueueEntry({
            href: 'https://media.example.test/movie.mkv?token=secret',
            fileName: 'movie.mkv',
        }, 'Example film', 100)).toEqual({
            id: '100-https://media.example.test/movie.mkv?token=secret',
            href: 'https://media.example.test/movie.mkv?token=secret',
            fileName: 'movie.mkv',
            title: 'Example film',
            requestedAt: 100,
        });

        expect(createDownloadQueueEntry({ href: 'https://media.example.test/video.mkv' }, 'Film')).toBeNull();
        expect(createDownloadQueueEntry({ href: 'magnet:?xt=urn:btih:abc', fileName: 'movie.mkv' }, 'Film')).toBeNull();
        expect(createDownloadQueueEntry({ href: 'http://media.example.test/video.mkv', fileName: 'movie.mkv' }, 'Film')).toBeNull();
    });

    test('deduplicates by URL and retains only the newest ten requests', () => {
        let entries = [];
        for (let index = 0; index < MAX_RECENT_DOWNLOADS + 2; index += 1) {
            entries = addDownloadQueueEntry(entries, createDownloadQueueEntry({
                href: `https://media.example.test/${index}.mkv`,
                fileName: `${index}.mkv`,
            }, 'Film', index));
        }

        expect(entries).toHaveLength(MAX_RECENT_DOWNLOADS);
        expect(entries[0].fileName).toBe('11.mkv');
        expect(addDownloadQueueEntry(entries, createDownloadQueueEntry({
            href: 'https://media.example.test/11.mkv',
            fileName: 'renamed.mkv',
        }, 'Film', 12))).toHaveLength(MAX_RECENT_DOWNLOADS);
        expect(addDownloadQueueEntry(entries, null)).toEqual(entries);
    });
});
