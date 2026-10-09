const langs = require('langs');
const CONSTANTS = require('../../common/CONSTANTS');

const allLanguages = langs.all();
const normalizeSubtitleLanguage = (language) => {
    if (typeof language !== 'string' || language.trim().length === 0) {
        return undefined;
    }

    const value = language.trim();
    const normalized = allLanguages.find((lang) => [lang['1'], lang['2'], lang['2B'], lang['2T'], lang['3'], lang.ietf]
        .includes(value) || [lang['1'], lang['2'], lang['2B'], lang['2T'], lang['3'], lang.ietf]
        .includes(value.toLowerCase()));

    return normalized?.['2'];
};

const buildSubtitleCandidates = (sessionPreference, savedTrack, globalLanguage) => {
    const candidates = [];
    const languagesOrder = [];
    const sessionEnabled = sessionPreference?.enabled === true;
    const sessionLanguage = normalizeSubtitleLanguage(sessionPreference?.language);
    const savedLanguage = normalizeSubtitleLanguage(savedTrack?.language);
    const savedSource = savedTrack ? (savedTrack.embedded ? 'embedded' : 'external') : undefined;
    const preferredSource = sessionEnabled ? sessionPreference.source : savedSource;
    const sources = preferredSource === 'external' ? ['external', 'embedded'] : ['embedded', 'external'];

    const addLanguage = (language) => {
        if (language && !languagesOrder.includes(language)) {
            languagesOrder.push(language);
        }
    };

    if (savedTrack?.id && (!sessionEnabled ||
        !sessionPreference.source || sessionPreference.source === savedSource)) {
        candidates.push({
            source: savedSource,
            id: savedTrack.id,
            ...(sessionLanguage ? { language: sessionLanguage } : {}),
        });
    }

    if (sessionEnabled) {
        addLanguage(sessionLanguage ?? savedLanguage);
    } else {
        addLanguage(savedLanguage);
    }
    addLanguage(normalizeSubtitleLanguage(globalLanguage));
    if (sessionEnabled) {
        addLanguage(normalizeSubtitleLanguage(CONSTANTS.DEFAULT_SUBTITLES_LANGUAGE));
    }

    // Keep language ahead of source so a preferred-language track wins across sources.
    languagesOrder.forEach((language) => {
        sources.forEach((source) => candidates.push({ source, language }));
    });

    return candidates;
};

const resolveCandidate = (candidate, embeddedTracks, externalTracks) => {
    const tracks = candidate.source === 'embedded' ? embeddedTracks : externalTracks;
    const languageCode = normalizeSubtitleLanguage(candidate.language);
    const track = candidate.id ?
        tracks.find(({ id }) => id === candidate.id)
        :
        languageCode ? tracks.find(({ lang }) => normalizeSubtitleLanguage(lang) === languageCode) : undefined;

    return track && (!languageCode || normalizeSubtitleLanguage(track.lang) === languageCode) ? track : undefined;
};

const resolveBestSubtitleCandidate = (candidates, embeddedTracks, externalTracks) => {
    for (let rank = 0; rank < candidates.length; rank++) {
        const candidate = candidates[rank];
        const track = resolveCandidate(candidate, embeddedTracks, externalTracks);
        if (track) {
            return { source: candidate.source, rank, track };
        }
    }

    return undefined;
};

module.exports = {
    buildSubtitleCandidates,
    normalizeSubtitleLanguage,
    resolveBestSubtitleCandidate,
};
