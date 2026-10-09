const { classifySource, evaluateCandidate, rankCandidates } = require('../src/routes/MetaDetails/StreamsList/rankCandidates');

describe('source candidate ranking', () => {
    test('classifies only explicit source descriptors', () => {
        expect(classifySource({ url: 'https://media.example/video.mp4' })).toBe('https-file');
        expect(classifySource({ url: 'https://media.example/live.m3u8' })).toBe('hls');
        expect(classifySource({ url: 'https://media.example/live.mpd' })).toBe('dash');
        expect(classifySource({ url: 'http://media.example/video.mp4' })).toBe('http-file');
        expect(classifySource({ infoHash: 'synthetic-hash' })).toBe('torrent');
        expect(classifySource({ url: 'magnet:?xt=urn:btih:synthetic-hash' })).toBe('torrent');
        expect(classifySource({ name: '4K Debrid release' })).toBe('unknown');
    });

    test('ranks by explicit readiness, reliability and quality while keeping ties stable', () => {
        const result = rankCandidates([
            { id: 'provider-a-0', stream: {}, signals: {} },
            { id: 'provider-b-0', stream: {}, signals: { readyToPlay: true, reliabilityScore: 0.8, qualityScore: 0.9 } },
            { id: 'provider-c-0', stream: {}, signals: { readyToPlay: true, reliabilityScore: 0.8, qualityScore: 0.9 } },
        ]);

        expect(result.candidates.map(({ id }) => id)).toEqual(['provider-b-0', 'provider-c-0', 'provider-a-0']);
        expect(result.candidates[0].score).toBe(66.5);
        expect(result.candidates[0].rationale).toContain('Source is marked ready to play.');
    });

    test('uses advertised resolution labels without treating file size as measured bitrate', () => {
        const result = rankCandidates([
            { id: '720p', stream: { name: 'Synthetic sample 720p WEB' }, signals: {} },
            { id: '4k', stream: { description: 'Synthetic sample 4K HDR10 HEVC' }, signals: {} },
        ]);

        expect(result.candidates.map(({ id }) => id)).toEqual(['4k', '720p']);
        expect(result.candidates[0].kind).toBe('unknown');
        expect(result.candidates[0].rationale).toContain('Advertised resolution: 2160p.');
        expect(result.candidates[0].rationale).toContain('Advertised video codec: hevc.');
        expect(result.candidates[0].rationale).toContain('Advertised HDR mode: hdr10.');
    });

    test('rejects known unavailable and incompatible sources', () => {
        const unavailable = evaluateCandidate({ id: 'unavailable', stream: {}, signals: { available: false } });
        const unsupportedCodec = evaluateCandidate({
            id: 'codec',
            stream: {},
            signals: { videoCodec: 'av1' },
        }, { capabilities: { supportedCodecs: ['h264'] } });
        const tooLarge = evaluateCandidate({ id: 'resolution', stream: {}, signals: { resolution: 2160 } }, {
            capabilities: { maxResolution: 1080 },
        });

        expect(unavailable.rejected).toContain('Source is reported unavailable.');
        expect(unsupportedCodec.rejected).toContain('Video codec is unsupported on this device.');
        expect(tooLarge.rejected).toContain('Resolution exceeds the device limit.');
    });

    test('HTTPS-only policy excludes torrents and plain HTTP without touching descriptors', () => {
        const secretUrl = 'https://media.example/video.mp4?token=secret';
        const result = rankCandidates([
            { id: 'direct', stream: { url: secretUrl }, signals: { readyToPlay: true } },
            { id: 'torrent', stream: { url: 'magnet:?xt=urn:btih:synthetic-hash' }, signals: {} },
            { id: 'http', stream: { url: 'http://media.example/video.mp4' }, signals: {} },
            {
                id: 'mislabeled-torrent',
                stream: { sourceKind: 'https-file', url: 'https://media.example/video.mp4', infoHash: 'synthetic-hash' },
                signals: {},
            },
        ], { privacyMode: 'https-only' });

        expect(result.candidates.map(({ id }) => id)).toEqual(['direct']);
        expect(result.rejected.map(({ id }) => id)).toEqual(['torrent', 'http', 'mislabeled-torrent']);
        expect(JSON.stringify(result)).not.toContain('secret');
        expect(JSON.stringify(result)).not.toContain('synthetic-hash');
    });

    test('HTTPS-only policy requires an explicit HTTPS URL even when source kind claims HTTPS', () => {
        const result = rankCandidates([
            { id: 'magnet-mislabeled', stream: { sourceKind: 'https-file', url: 'magnet:?xt=urn:btih:synthetic-hash' }, signals: {} },
            { id: 'missing-url', stream: { sourceKind: 'https-file' }, signals: {} },
            { id: 'empty-info-hash', stream: { sourceKind: 'https-file', url: 'https://media.example/video.mp4', infoHash: '  ' }, signals: {} },
        ], { privacyMode: 'https-only' });

        expect(result.candidates.map(({ id }) => id)).toEqual(['empty-info-hash']);
        expect(result.rejected.map(({ id }) => id)).toEqual(['magnet-mislabeled', 'missing-url']);
    });

    test('protected torrent mode fails closed when the route is not confirmed', () => {
        const torrent = { id: 'torrent', stream: { infoHash: 'synthetic-hash' }, signals: { readyToPlay: true } };

        expect(rankCandidates([torrent], {
            privacyMode: 'protected-torrent',
            capabilities: { protectedRouteReady: false },
        }).candidates).toHaveLength(0);
        expect(rankCandidates([torrent], {
            privacyMode: 'protected-torrent',
            capabilities: { protectedRouteReady: true },
        }).candidates).toHaveLength(1);
    });

    test('does not infer measured throughput from file size or duration', () => {
        const result = evaluateCandidate({
            id: 'file',
            stream: { sizeBytes: 1000000000, durationSeconds: 3600 },
            signals: {},
        });

        expect(result.score).toBe(0);
        expect(result.rationale).toEqual(['No readiness, quality, reliability, or throughput signals were available; provider order is retained.']);
    });
});
