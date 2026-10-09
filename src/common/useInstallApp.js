const React = require('react');
const { readDismissal, writeDismissal, getInstallHelpKey, isDesktopWrapper } = require('./installApp');

const isDesktopApp = () => typeof window !== 'undefined' && isDesktopWrapper(window.navigator.userAgent);

const isStandalone = () => {
    if (typeof window === 'undefined') return false;
    return window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
};

const getLocalStorage = () => {
    try {
        return typeof window === 'undefined' ? null : window.localStorage;
    } catch (_) {
        return null;
    }
};

const useInstallApp = () => {
    const [deferredPrompt, setDeferredPrompt] = React.useState(null);
    const [hidden, setHidden] = React.useState(() => isDesktopApp() || isStandalone() || readDismissal(getLocalStorage()));

    React.useEffect(() => {
        if (isDesktopApp()) return undefined;

        const onBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
        };
        const onAppInstalled = () => setHidden(true);
        const onDisplayModeChange = () => setHidden(isDesktopApp() || isStandalone() || readDismissal(getLocalStorage()));

        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);
        const displayMode = window.matchMedia?.('(display-mode: standalone)');
        displayMode?.addEventListener?.('change', onDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
            displayMode?.removeEventListener?.('change', onDisplayModeChange);
        };
    }, []);

    const install = React.useCallback(async () => {
        if (deferredPrompt === null) {
            return { type: 'help', key: getInstallHelpKey(window.navigator.userAgent) };
        }

        const prompt = deferredPrompt;
        setDeferredPrompt(null);
        let choice;
        try {
            await prompt.prompt();
            choice = await prompt.userChoice;
        } catch (_) {
            return { type: 'help', key: getInstallHelpKey(window.navigator.userAgent) };
        }
        if (choice?.outcome === 'accepted') {
            setHidden(true);
            return { type: 'accepted' };
        }

        writeDismissal(getLocalStorage());
        setHidden(true);
        return { type: 'dismissed' };
    }, [deferredPrompt]);

    return { available: !hidden, install };
};

module.exports = useInstallApp;
