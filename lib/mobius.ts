export type MobiusCin = {
    ri?: string;
    rn?: string;
    lt?: string;
    ct?: string;
    con?: {
        status?: unknown;
        location?: string;
        label?: string;
        name?: string;
        entity_name?: string;
        unit_number?: number | string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

export type MobiusAlertPayload = {
    id: string;
    status: string;
    lineName: string;
    rawLocation?: string;
    timestamp?: string;
};

const normalizeTimestamp = (value?: string): string | undefined => {
    if (!value) return undefined;
    const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(value);
    if (!match) return value;
    const [, year, month, day, hour, minute, second] = match;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString();
};

const extractLineName = (location?: string, fallback?: string): string => {
    if (!location || typeof location !== 'string') {
        return fallback || 'Unknown line';
    }
    const parts = location.split('/').filter(Boolean);
    if (parts.length >= 2) {
        return parts[parts.length - 2] || location;
    }
    return location;
};

const flattenCinEntries = (payload: unknown): MobiusCin[] => {
    if (!payload) return [];
    if (Array.isArray(payload)) {
        return payload.flatMap(flattenCinEntries);
    }
    if (typeof payload === 'object') {
        const obj = payload as Record<string, unknown>;
        if (obj['m2m:cin']) {
            return flattenCinEntries(obj['m2m:cin']);
        }
        if (obj['m2m:rsp']) {
            return flattenCinEntries(obj['m2m:rsp']);
        }
        if (obj['m2m:cnt']) {
            const cnt = obj['m2m:cnt'] as Record<string, unknown>;
            const nested = flattenCinEntries(cnt['m2m:cin']);
            if (nested.length > 0) {
                return nested;
            }
        }
        return [obj as MobiusCin];
    }
    return [];
};

const createAlertFromCin = (cin: MobiusCin): MobiusAlertPayload | null => {
    if (!cin) return null;
    const statusValue = cin.con?.status ?? cin.con?.entity_name ?? cin.con?.name ?? cin.con?.label;
    const status = statusValue === undefined || statusValue === null
        ? undefined
        : String(statusValue);
    const rawLocation = cin.con?.location || cin.con?.label;
    const fallbackLine =
        cin.con?.label ||
        cin.con?.name ||
        cin.con?.entity_name ||
        (typeof cin.con?.unit_number !== 'undefined' ? `unit_${cin.con.unit_number}` : undefined);
    if (!status && !rawLocation) return null;

    return {
        id: cin.ri || cin.rn || `${Date.now()}-${Math.random()}`,
        status: status || 'unknown',
        lineName: extractLineName(rawLocation, fallbackLine),
        rawLocation,
        timestamp: normalizeTimestamp(cin.lt || cin.ct),
    };
};

export const parseMobiusAlerts = (payload: unknown): MobiusAlertPayload[] =>
    flattenCinEntries(payload)
        .map(createAlertFromCin)
        .filter((alert): alert is MobiusAlertPayload => Boolean(alert));

export type MobiusQueryOptions = {
    resultContent?: string;
    filterUsage?: string;
    type?: string;
    limit?: number;
    level?: number;
};

export const applyMobiusQueryDefaults = (
    baseUrl: string,
    {
        resultContent = '4',
        filterUsage = '2',
        type = '4',
        limit,
        level,
    }: MobiusQueryOptions = {},
): string => {
    const url = new URL(baseUrl);
    const ensure = (key: string, value?: string) => {
        if (!value) return;
        if (!url.searchParams.has(key)) {
            url.searchParams.set(key, value);
        }
    };

    ensure('rcn', resultContent);
    ensure('fu', filterUsage);
    ensure('ty', type);
    if (typeof limit === 'number' && limit > 0) {
        ensure('lim', String(limit));
    }
    if (typeof level === 'number' && level > 0) {
        ensure('lvl', String(level));
    }

    return url.toString();
};
