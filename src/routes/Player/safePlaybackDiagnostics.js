// Keep provider supplied messages and playback descriptors out of console logs.
const toSafePlaybackDiagnostic = (error) => {
    const diagnostic = { kind: 'playback-error' };

    if (typeof error?.code === 'number' && Number.isFinite(error.code)) {
        diagnostic.code = error.code;
    }

    if (typeof error?.critical === 'boolean') {
        diagnostic.critical = error.critical;
    }

    return diagnostic;
};

const logSafePlaybackError = (source, error) => {
    console.error(source, toSafePlaybackDiagnostic(error));
};

module.exports = {
    toSafePlaybackDiagnostic,
    logSafePlaybackError,
};
