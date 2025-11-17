import mqtt, { type MqttClient } from 'mqtt';
import { parseMobiusAlerts, type MobiusAlertPayload } from './mobius';

const DEFAULT_MQTT_URL = process.env.MOBIUS_MQTT_URL || 'mqtt://114.71.219.156:1883';
const MQTT_TOPICS = 'noti/event/json';
const MQTT_KEEPALIVE = Number(process.env.MOBIUS_MQTT_KEEPALIVE || '60');
const MQTT_BUFFER_SIZE = Number(process.env.MOBIUS_MQTT_BUFFER || '50');
const MQTT_RECONNECT_DELAY = Number(process.env.MOBIUS_MQTT_RECONNECT || '5000');

let client: MqttClient | null = null;
let connecting = false;
let latestAlerts: MobiusAlertPayload[] = [];

const handleMessage = (topic: string, payload: Buffer) => {
    try {
        const parsed = JSON.parse(payload.toString());
        const alerts = parseMobiusAlerts(parsed);
        if (alerts.length > 0) {
            latestAlerts = [...alerts, ...latestAlerts].slice(0, MQTT_BUFFER_SIZE);
        }
    } catch (error) {
        console.error('[MobiusMQTT] Failed to parse payload from', topic, error);
    }
};

const attachClientListeners = (mqttClient: MqttClient) => {
    mqttClient.on('message', handleMessage);

    mqttClient.on('connect', () => {
        console.info('[MobiusMQTT] Connected to broker');
        mqttClient.subscribe(MQTT_TOPICS, (err) => {
            if (err) {
                console.error('[MobiusMQTT] Failed to subscribe', MQTT_TOPICS, err);
            }
        });
    });

    mqttClient.on('error', (error) => {
        console.error('[MobiusMQTT] Connection error', error);
    });

    mqttClient.on('close', () => {
        console.warn('[MobiusMQTT] Connection closed, will retry');
        if (client) {
            client.removeListener('message', handleMessage);
            client = null;
        }
        setTimeout(() => {
            connecting = false;
            ensureMqttConnection();
        }, MQTT_RECONNECT_DELAY);
    });
};

export const ensureMqttConnection = () => {
    if (client || connecting) return;
    connecting = true;
    try {
        client = mqtt.connect(DEFAULT_MQTT_URL, {
            keepalive: MQTT_KEEPALIVE,
        });
        attachClientListeners(client);
    } catch (error) {
        console.error('[MobiusMQTT] Failed to connect', error);
        client = null;
        setTimeout(() => {
            connecting = false;
            ensureMqttConnection();
        }, MQTT_RECONNECT_DELAY);
        return;
    }
    connecting = false;
};

export const getLatestMqttAlerts = (): MobiusAlertPayload[] => latestAlerts;
