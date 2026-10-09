const SOURCE_KINDS = new Set([
    'https-file',
    'hls',
    'dash',
    'torrent',
    'debrid',
    'http-file',
    'youtube',
    'unknown',
]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const finiteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const getUrl = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    try {
        return new URL(value);
    } catch {
        return null;
    }
};

const classifySource = (stream) => {
    const declaredKind = stream?.sourceKind ?? stream?.kind;
    if (typeof declaredKind === 'string' && SOURCE_KINDS.has(declaredKind)) {
        return declaredKind;
    }

    if (typeof stream?.infoHash === 'string' && stream.infoHash.length > 0) {
        return 'torrent';
    }

    if (typeof stream?.ytId === 'string' && stream.ytId.length > 0) {
        return 'youtube';
    }

    const url = getUrl(stream?.url);
    if (!url) {
        return 'unknown';
    }

    if (url.protocol === 'magnet:' || url.protocol === 'torrent:') {
        return 'torrent';
    }

    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith('.m3u8')) {
        return 'hls';
    }
    if (pathname.endsWith('.mpd')) {
        return 'dash';
    }
    if (url.protocol === 'https:') {
        return 'https-file';
    }
    if (url.protocol === 'http:') {
        return 'http-file';
    }

    return 'unknown';
};

const hasHttpsUrl = (stream) => {
    const url = getUrl(stream?.url);
    return url?.protocol === 'https:';
};

const hasTorrentMarker = (stream) => {
    if (typeof stream?.infoHash === 'string' && stream.infoHash.trim().length > 0) {
        return true;
    }

    const url = getUrl(stream?.url);
    return url?.protocol === 'magnet:' || url?.protocol === 'torrent:';
};

const parseAdvertisedSignals = (stream = {}) => {
    const description = [stream.name, stream.description]
        .filter((value) => typeof value === 'string')
        .join(' ');
    const signals = {};
    const resolutionMatch = description.match(/(?:^|\b)(2160p|1080p|720p|576p|480p|4k|uhd)(?:\b|$)/i);
    const codecMatch = description.match(/(?:^|[\W_])(av1|hevc|h\.?265|x265|h\.?264|avc|x264|vp9)(?=$|[\W_])/i);
    const hdrMatch = description.match(/(?:^|[\W_])(dolby[\s._-]?vision|hdr10\+?|hlg|dv)(?=$|[\W_])/i);

    if (resolutionMatch) {
        const resolution = resolutionMatch[1].toLowerCase();
        signals.resolution = resolution === '4k' || resolution === 'uhd' ? 2160 : Number.parseInt(resolution, 10);
    }

    if (codecMatch) {
        const codec = codecMatch[1].toLowerCase().replace(/[.\s]/g, '');
        signals.videoCodec = ['h265', 'x265', 'hevc'].includes(codec) ? 'hevc' :
            ['h264', 'x264', 'avc'].includes(codec) ? 'h264' : codec;
    }

    if (hdrMatch) {
        const hdr = hdrMatch[1].toLowerCase().replace(/[\s._-]/g, '');
        signals.hdr = hdr === 'dolbyvision' || hdr === 'dv' ? 'dolby-vision' : hdr;
    }

    return signals;
};

const evaluateCandidate = (candidate, { capabilities = {}, privacyMode = 'standard' } = {}) => {
    const { stream = {} } = candidate;
    const signals = { ...parseAdvertisedSignals(stream), ...candidate.signals };
    const kind = classifySource(stream);
    const rejected = [];

    if (signals.available === false || signals.readyToPlay === false) {
        rejected.push('Source is reported unavailable.');
    }

    if (candidate.launchable === false) {
        rejected.push('No player link is available for this source on this device.');
    }

    if (Array.isArray(capabilities.supportedKinds) && !capabilities.supportedKinds.includes(kind)) {
        rejected.push('Source type is unsupported on this device.');
    }

    if (finiteNumber(signals.resolution) && finiteNumber(capabilities.maxResolution) && signals.resolution > capabilities.maxResolution) {
        rejected.push('Resolution exceeds the device limit.');
    }

    if (typeof signals.videoCodec === 'string' && Array.isArray(capabilities.supportedCodecs) && !capabilities.supportedCodecs.includes(signals.videoCodec)) {
        rejected.push('Video codec is unsupported on this device.');
    }

    if (typeof signals.hdr === 'string' && Array.isArray(capabilities.hdrModes) && signals.hdr !== 'none' && !capabilities.hdrModes.includes(signals.hdr)) {
        rejected.push('HDR mode is unsupported on this device.');
    }

    if (privacyMode === 'https-only' && (kind === 'torrent' || hasTorrentMarker(stream) || !hasHttpsUrl(stream))) {
        rejected.push('HTTPS-only privacy mode excludes this source.');
    }

    if (privacyMode === 'protected-torrent' && kind === 'torrent' && capabilities.protectedRouteReady !== true) {
        rejected.push('Protected torrent route is not confirmed.');
    }

    if (rejected.length > 0) {
        return { id: candidate.id, kind, score: null, rationale: [], rejected };
    }

    let score = 0;
    const rationale = [];

    if (signals.readyToPlay === true) {
        score += 24;
        rationale.push('Source is marked ready to play.');
    }

    if (finiteNumber(signals.estimatedStartupMs) && signals.estimatedStartupMs >= 0) {
        const startupScore = 6 * (1 - clamp(signals.estimatedStartupMs, 0, 12000) / 12000);
        score += startupScore;
        rationale.push(`Reported startup estimate: ${Math.round(signals.estimatedStartupMs)} ms.`);
    }

    if (finiteNumber(signals.reliabilityScore)) {
        const reliabilityScore = 25 * clamp(signals.reliabilityScore, 0, 1);
        score += reliabilityScore;
        rationale.push(`Reported reliability: ${Math.round(clamp(signals.reliabilityScore, 0, 1) * 100)}%.`);
    }

    if (finiteNumber(signals.qualityScore)) {
        const qualityScore = 25 * clamp(signals.qualityScore, 0, 1);
        score += qualityScore;
        rationale.push(`Reported picture quality score: ${Math.round(clamp(signals.qualityScore, 0, 1) * 100)}%.`);
    } else if (finiteNumber(signals.resolution)) {
        const maxResolution = finiteNumber(capabilities.maxResolution) ? capabilities.maxResolution : 2160;
        const qualityScore = 25 * clamp(signals.resolution / maxResolution, 0, 1);
        score += qualityScore;
        rationale.push(`Advertised resolution: ${Math.round(signals.resolution)}p.`);
    }

    if (typeof signals.videoCodec === 'string') {
        rationale.push(`Advertised video codec: ${signals.videoCodec}.`);
    }

    if (typeof signals.hdr === 'string') {
        rationale.push(`Advertised HDR mode: ${signals.hdr}.`);
    }

    if (finiteNumber(signals.measuredThroughputMbps) && finiteNumber(signals.requiredBitrateMbps) && signals.requiredBitrateMbps > 0) {
        const safetyRatio = signals.measuredThroughputMbps / signals.requiredBitrateMbps;
        const throughputScore = 15 * clamp(safetyRatio / 2, 0, 1);
        score += throughputScore;
        rationale.push(`Measured throughput is ${safetyRatio.toFixed(1)}× the reported bitrate requirement.`);
    }

    if (finiteNumber(signals.preferenceScore)) {
        const preferenceScore = 5 * clamp(signals.preferenceScore, 0, 1);
        score += preferenceScore;
        rationale.push(`User preference match: ${Math.round(clamp(signals.preferenceScore, 0, 1) * 100)}%.`);
    }

    if (rationale.length === 0) {
        rationale.push('No readiness, quality, reliability, or throughput signals were available; provider order is retained.');
    }

    return { id: candidate.id, kind, score, rationale, rejected };
};

const rankCandidates = (candidates, options = {}) => {
    const ranked = [];
    const rejected = [];

    candidates.forEach((candidate, index) => {
        const result = evaluateCandidate(candidate, options);
        if (result.rejected.length > 0) {
            rejected.push({ id: candidate.id, reasons: result.rejected });
        } else {
            ranked.push({ ...result, originalIndex: index });
        }
    });

    ranked.sort((left, right) => right.score - left.score || left.originalIndex - right.originalIndex);

    return {
        candidates: ranked,
        rejected,
        rationale: ranked[0]?.rationale ?? [],
    };
};

module.exports = {
    classifySource,
    evaluateCandidate,
    rankCandidates,
};
