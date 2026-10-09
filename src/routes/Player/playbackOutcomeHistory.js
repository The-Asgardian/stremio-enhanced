const STORAGE_KEY = 'stremio.playback-outcomes.v1';
const MAX_ENTRIES = 100;
const MAX_ATTEMPTS = 10000;
const MAX_STARTUP_MS = 120000;
const MIN_OBSERVATIONS = 5;
const ENTRY_KEY_PATTERN = /^[a-f0-9]{8}$/;

const finiteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const hashIdentity = (value) => {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
};

const createOutcomeKey = ({ addonId, platform, kind } = {}) => {
    if (typeof addonId !== 'string' || addonId.length === 0 || addonId.length > 256 ||
        typeof platform !== 'string' || platform.length === 0 || platform.length > 32 ||
        typeof kind !== 'string' || kind.length === 0 || kind.length > 32) {
        return null;
    }
    return hashIdentity(`${addonId}\u0000${platform}\u0000${kind}`);
};

const normalizeEntry = (entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const attempts = finiteNumber(entry.attempts) ? Math.floor(entry.attempts) : -1;
    const successes = finiteNumber(entry.successes) ? Math.floor(entry.successes) : -1;
    const startupMs = entry.startupMs;
    if (attempts < 0 || attempts > MAX_ATTEMPTS || successes < 0 || successes > attempts ||
        !finiteNumber(startupMs) || startupMs < 0 || startupMs > MAX_STARTUP_MS) {
        return null;
    }
    return { attempts, successes, startupMs };
};

const parseHistory = (raw) => {
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!parsed || parsed.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) {
            return {};
        }
        return Object.entries(parsed.entries)
            .filter(([key]) => ENTRY_KEY_PATTERN.test(key))
            .slice(0, MAX_ENTRIES)
            .reduce((entries, [key, value]) => {
                const normalized = normalizeEntry(value);
                if (normalized) entries[key] = normalized;
                return entries;
            }, {});
    } catch {
        return {};
    }
};

const getStorage = (storage) => {
    if (storage !== undefined) return storage;
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
};

const readPlaybackOutcomeHistory = (storage) => {
    try {
        const target = getStorage(storage);
        return target ? parseHistory(target.getItem(STORAGE_KEY)) : {};
    } catch {
        return {};
    }
};

const getPlaybackOutcome = (identity, storage) => {
    const key = createOutcomeKey(identity);
    if (!key) return null;
    return readPlaybackOutcomeHistory(storage)[key] ?? null;
};

const recordPlaybackOutcome = ({ addonId, platform, kind, outcome, startupMs }, storage) => {
    const key = createOutcomeKey({ addonId, platform, kind });
    if (!key || !['success', 'failure'].includes(outcome)) return false;
    if (outcome === 'success' && (!finiteNumber(startupMs) || startupMs < 0 || startupMs > MAX_STARTUP_MS)) return false;

    try {
        const target = getStorage(storage);
        if (!target) return false;
        const entries = parseHistory(target.getItem(STORAGE_KEY));
        const existing = entries[key] ?? { attempts: 0, successes: 0, startupMs: 0 };
        const attempts = Math.min(MAX_ATTEMPTS, existing.attempts + 1);
        const successes = Math.min(attempts, existing.successes + (outcome === 'success' ? 1 : 0));
        const startupCount = existing.successes;
        const nextStartupMs = outcome === 'success' ?
            (startupCount === 0 ? startupMs : existing.startupMs + ((startupMs - existing.startupMs) / (startupCount + 1)))
            : existing.startupMs;
        entries[key] = { attempts, successes, startupMs: Math.min(MAX_STARTUP_MS, Math.max(0, nextStartupMs)) };

        const boundedEntries = Object.entries(entries).slice(-MAX_ENTRIES);
        target.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: Object.fromEntries(boundedEntries) }));
        return true;
    } catch {
        return false;
    }
};

const toRankingSignals = (entry) => {
    const normalized = normalizeEntry(entry);
    if (!normalized || normalized.attempts < MIN_OBSERVATIONS) return null;
    return {
        reliabilityScore: normalized.successes / normalized.attempts,
        ...(normalized.successes > 0 ? { estimatedStartupMs: normalized.startupMs } : {}),
    };
};

module.exports = {
    STORAGE_KEY,
    MAX_ENTRIES,
    MIN_OBSERVATIONS,
    createOutcomeKey,
    parseHistory,
    readPlaybackOutcomeHistory,
    getPlaybackOutcome,
    recordPlaybackOutcome,
    toRankingSignals,
};
