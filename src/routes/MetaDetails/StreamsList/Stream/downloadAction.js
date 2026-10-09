const isAllowedDownloadUrl = (value) => {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return false;
    }

    try {
        const url = new URL(value);
        if (url.username || url.password) {
            return false;
        }

        return url.protocol === 'https:' || (
            url.protocol === 'http:' &&
            (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '[::1]')
        );
    } catch {
        return false;
    }
};

const safeFileName = (value, url) => {
    let pathFileName = 'download';
    try {
        pathFileName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || 'download');
    } catch {
        pathFileName = 'download';
    }

    const fileName = typeof value === 'string' && value.trim().length > 0 ?
        value
        :
        pathFileName;

    return Array.from(fileName
        .replace(/[\\/]+/g, '_'))
        .filter((character) => {
            const code = character.charCodeAt(0);
            return code >= 32 && code !== 127;
        })
        .join('')
        .replace(/^\.+/, '')
        .trim() || 'download';
};

const getDownloadAction = (deepLinks) => {
    const urlValue = deepLinks?.externalPlayer?.download;
    if (!isAllowedDownloadUrl(urlValue)) {
        return null;
    }

    const url = new URL(urlValue);
    return {
        href: urlValue.trim(),
        fileName: safeFileName(deepLinks.externalPlayer.fileName, url),
    };
};

module.exports = { getDownloadAction, isAllowedDownloadUrl };
