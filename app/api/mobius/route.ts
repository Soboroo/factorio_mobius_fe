import { NextResponse } from 'next/server';
import { applyMobiusQueryDefaults, parseMobiusAlerts } from '@/lib/mobius';
import { ensureMqttConnection, getLatestMqttAlerts } from '@/lib/mobiusMqtt';

const MOBIUS_DEFAULT_ENDPOINTS = [
    'http://114.71.219.156:7599/Mobius/ae1',
];
const MOBIUS_ENDPOINTS = (process.env.MOBIUS_POLL_URLS || process.env.MOBIUS_POLL_URL || MOBIUS_DEFAULT_ENDPOINTS.join(','))
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
const MOBIUS_ORIGIN = process.env.MOBIUS_POLL_ORIGIN || 'SM';
const REQUEST_ID = process.env.MOBIUS_POLL_REQUEST_ID || 'mobius-poll';
const MOBIUS_LIMIT = Number(process.env.MOBIUS_POLL_LIMIT || '5');
const MOBIUS_LEVEL = Number(process.env.MOBIUS_POLL_LEVEL || '5');

export const dynamic = 'force-dynamic';

const fetchMobiusViaHttp = async () => {
    const results = await Promise.allSettled(
        MOBIUS_ENDPOINTS.map(async (endpoint) => {
            const targetUrl = applyMobiusQueryDefaults(endpoint, {
                limit: MOBIUS_LIMIT,
                level: MOBIUS_LEVEL,
            });

            const response = await fetch(targetUrl, {
                headers: {
                    Accept: 'application/json',
                    'X-M2M-Origin': MOBIUS_ORIGIN,
                    'X-M2M-RI': REQUEST_ID,
                },
                cache: 'no-store',
                next: { revalidate: 0 },
            });

            if (!response.ok) {
                throw new Error(`Mobius request failed: ${response.status} ${response.statusText}`);
            }

            const payload = await response.json();
            return parseMobiusAlerts(payload);
        }),
    );

    const alerts = results
        .filter((result): result is PromiseFulfilledResult<ReturnType<typeof parseMobiusAlerts>> => result.status === 'fulfilled')
        .flatMap(result => result.value);

    const warnings = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason?.message || 'Unknown error');

    return { alerts, warnings };
};

export async function GET() {
    try {
        ensureMqttConnection();
        const mqttAlerts = getLatestMqttAlerts();

        if (mqttAlerts.length > 0) {
            return NextResponse.json({ alerts: mqttAlerts, source: 'mqtt' });
        }

        const { alerts, warnings } = await fetchMobiusViaHttp();

        if (alerts.length === 0) {
            return NextResponse.json({ alerts: [], warnings });
        }

        const seen = new Set<string>();
        const uniqueAlerts = alerts.filter(alert => {
            if (seen.has(alert.id)) return false;
            seen.add(alert.id);
            return true;
        });

        return NextResponse.json({ alerts: uniqueAlerts, source: 'http', warnings });
    } catch (error) {
        console.error('Failed to fetch Mobius events', error);
        return NextResponse.json(
            { alerts: [], error: (error as Error).message },
            { status: 200 },
        );
    }
}
