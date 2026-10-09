/* global describe, test, expect */

const getResumeVideo = require('../src/routes/MetaDetails/resumeVideo');

const video = {
    id: 'episode-2',
    title: 'The Next Chapter',
    season: 1,
    episode: 2,
    upcoming: false,
    deepLinks: { player: '#/player/series/episode-2' },
};

describe('title details resume action', () => {
    test('returns the saved in-progress video when core provides a player deep link', () => {
        expect(getResumeVideo([video], {
            state: { video_id: 'episode-2', timeOffset: 240, duration: 1200 },
        })).toBe(video);
    });

    test('does not offer resume for missing, finished, upcoming, or unroutable videos', () => {
        expect(getResumeVideo([video], null)).toBeNull();
        expect(getResumeVideo([video], {
            state: { video_id: 'episode-2', timeOffset: 1200, duration: 1200 },
        })).toBeNull();
        expect(getResumeVideo([{ ...video, upcoming: true }], {
            state: { video_id: 'episode-2', timeOffset: 240, duration: 1200 },
        })).toBeNull();
        expect(getResumeVideo([{ ...video, deepLinks: { player: null } }], {
            state: { video_id: 'episode-2', timeOffset: 240, duration: 1200 },
        })).toBeNull();
    });
});
