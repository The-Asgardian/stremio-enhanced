// Return the saved in-progress video only when core has a usable player route.
const getResumeVideo = (videos, libraryItem) => {
    const state = libraryItem?.state;
    if (
        !Array.isArray(videos) ||
        typeof state?.video_id !== 'string' ||
        !Number.isFinite(state.timeOffset) ||
        !Number.isFinite(state.duration) ||
        state.timeOffset <= 0 ||
        state.duration <= state.timeOffset
    ) {
        return null;
    }

    return videos.find((video) =>
        video.id === state.video_id &&
        video.upcoming !== true &&
        typeof video.deepLinks?.player === 'string' &&
        video.deepLinks.player.length > 0
    ) ?? null;
};

module.exports = getResumeVideo;
