const {
    DISMISSAL_KEY,
    isDismissalActive,
    isDesktopWrapper,
    getInstallHelpKey,
    readDismissal,
    writeDismissal
} = require('../src/common/installApp');

describe('install app helpers', () => {
    const now = 1_800_000_000_000;

    test('keeps a dismissed prompt quiet for thirty days only', () => {
        expect(isDismissalActive(String(now), now)).toBe(true);
        expect(isDismissalActive(String(now), now + 29 * 24 * 60 * 60 * 1000)).toBe(true);
        expect(isDismissalActive(String(now), now + 30 * 24 * 60 * 60 * 1000)).toBe(false);
        expect(isDismissalActive('not-a-time', now)).toBe(false);
    });

    test('uses iOS share-sheet help where available', () => {
        expect(getInstallHelpKey('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('PWA_INSTALL_IOS_HELP');
        expect(getInstallHelpKey('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('PWA_INSTALL_BROWSER_HELP');
    });

    test('recognizes the packaged desktop wrapper', () => {
        expect(isDesktopWrapper('Mozilla/5.0 Chrome/140.0.0.0 Electron/40.0.0')).toBe(true);
        expect(isDesktopWrapper('Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36')).toBe(false);
    });

    test('reads, expires, and safely writes local dismissal state', () => {
        const data = new Map([[DISMISSAL_KEY, String(now)]]);
        const storage = {
            getItem: (key) => data.get(key) ?? null,
            setItem: (key, value) => data.set(key, value),
            removeItem: (key) => data.delete(key)
        };

        expect(readDismissal(storage, now)).toBe(true);
        expect(readDismissal(storage, now + 30 * 24 * 60 * 60 * 1000)).toBe(false);
        expect(data.has(DISMISSAL_KEY)).toBe(false);
        writeDismissal(storage, now);
        expect(data.get(DISMISSAL_KEY)).toBe(String(now));
        expect(readDismissal({ getItem: () => { throw new Error('blocked'); } }, now)).toBe(false);
    });
});
