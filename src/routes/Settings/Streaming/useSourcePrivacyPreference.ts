import { useCallback, useState } from 'react';
import {
    readRecommendHttpsSourcesOnly,
    writeRecommendHttpsSourcesOnly,
} from './sourcePrivacyPreference';

const useSourcePrivacyPreference = () => {
    const [recommendHttpsSourcesOnly, setPreference] = useState<boolean>(readRecommendHttpsSourcesOnly);

    const setRecommendHttpsSourcesOnly = useCallback((enabled: boolean) => {
        const saved = writeRecommendHttpsSourcesOnly(enabled);
        // If browser storage is unavailable, keep the UI permissive and unchecked.
        setPreference(saved && enabled);
    }, []);

    return { recommendHttpsSourcesOnly, setRecommendHttpsSourcesOnly };
};

export default useSourcePrivacyPreference;
