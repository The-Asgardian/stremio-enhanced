const SOURCE_PRIVACY_PREFERENCE_KEY = 'stremio.enhanced.sourcePrivacy.httpsOnly.v1';

const getStorage = () => {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch (_error) {
        return null;
    }
};

const readRecommendHttpsSourcesOnly = (storage = getStorage()) => {
    try {
        return storage?.getItem(SOURCE_PRIVACY_PREFERENCE_KEY) === 'true';
    } catch (_error) {
        return false;
    }
};

const writeRecommendHttpsSourcesOnly = (enabled, storage = getStorage()) => {
    if (typeof enabled !== 'boolean' || !storage) return false;

    try {
        storage.setItem(SOURCE_PRIVACY_PREFERENCE_KEY, enabled ? 'true' : 'false');
        return true;
    } catch (_error) {
        return false;
    }
};

module.exports = {
    SOURCE_PRIVACY_PREFERENCE_KEY,
    readRecommendHttpsSourcesOnly,
    writeRecommendHttpsSourcesOnly,
};
