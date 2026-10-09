const DISMISSAL_KEY = 'stremio.pwaInstallDismissedAt';
const DISMISSAL_DAYS = 30;

const isDismissalActive = (value, now = Date.now()) => {
    const dismissedAt = Number(value);
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
};

const isDesktopWrapper = (userAgent = '') => /\bElectron\//i.test(userAgent);

const getInstallHelpKey = (userAgent = '') => /iPad|iPhone|iPod/i.test(userAgent) ? 'PWA_INSTALL_IOS_HELP' : 'PWA_INSTALL_BROWSER_HELP';

const readDismissal = (storage, now = Date.now()) => {
    try {
        const value = storage?.getItem(DISMISSAL_KEY);
        if (!isDismissalActive(value, now)) {
            storage?.removeItem(DISMISSAL_KEY);
            return false;
        }
        return true;
    } catch (_) {
        return false;
    }
};

const writeDismissal = (storage, now = Date.now()) => {
    try {
        storage?.setItem(DISMISSAL_KEY, String(now));
    } catch (_) {
        // Storage may be disabled; installation remains usable for this session.
    }
};

module.exports = { DISMISSAL_KEY, isDismissalActive, isDesktopWrapper, getInstallHelpKey, readDismissal, writeDismissal };
