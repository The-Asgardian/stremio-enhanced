const MAX_RECENT_DOWNLOADS = 10;
const { isAllowedDownloadUrl } = require('./Stream/downloadAction');

const createDownloadQueueEntry = (action, title, now = Date.now()) => {
    if (!action || !isAllowedDownloadUrl(action.href) || typeof action.fileName !== 'string' || !action.fileName.trim()) {
        return null;
    }

    return {
        id: `${now}-${action.href.trim()}`,
        href: action.href.trim(),
        fileName: action.fileName.trim(),
        title: typeof title === 'string' && title.trim() ? title.trim() : action.fileName,
        requestedAt: now,
    };
};

const addDownloadQueueEntry = (entries, entry) => {
    if (!entry) {
        return Array.isArray(entries) ? entries : [];
    }

    return [entry, ...(Array.isArray(entries) ? entries.filter(({ href }) => href !== entry.href) : [])]
        .slice(0, MAX_RECENT_DOWNLOADS);
};

module.exports = { MAX_RECENT_DOWNLOADS, createDownloadQueueEntry, addDownloadQueueEntry };
