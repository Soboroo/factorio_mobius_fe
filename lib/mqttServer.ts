/**
 * 서버 사이드 MQTT 클라이언트
 * 브라우저에서는 일반 MQTT(1883)를 사용할 수 없으므로
 * Node.js 서버에서 MQTT를 구독하고 클라이언트로 전달
 */

import mqtt, { MqttClient } from 'mqtt';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://114.71.219.156:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'noti/event/json';
const MAX_MESSAGES = 100;

let client: MqttClient | null = null;
let isConnecting = false;
const messageBuffer: Array<{ topic: string; message: string; timestamp: number }> = [];

/**
 * MQTT 클라이언트 초기화
 */
export function initMqttClient() {
  if (client || isConnecting) {
    console.log('[MQTT Server] Already connected or connecting');
    return client;
  }

  isConnecting = true;
  console.log('[MQTT Server] Connecting to:', MQTT_BROKER_URL);
  console.log('[MQTT Server] Topic:', MQTT_TOPIC);

  try {
    client = mqtt.connect(MQTT_BROKER_URL, {
      reconnectPeriod: 5000,
      keepalive: 60,
    });

    client.on('connect', () => {
      console.log('[MQTT Server] ✅ Connected to MQTT broker');
      isConnecting = false;

      if (client) {
        client.subscribe(MQTT_TOPIC, (err) => {
          if (err) {
            console.error('[MQTT Server] ❌ Failed to subscribe:', err);
          } else {
            console.log('[MQTT Server] ✅ Subscribed to topic:', MQTT_TOPIC);
          }
        });
      }
    });

    client.on('message', (topic, payload) => {
      const message = payload.toString();
      const timestamp = Date.now();
      
      console.log('[MQTT Server] 📩 Message received:', {
        topic,
        messageLength: message.length,
        timestamp: new Date(timestamp).toISOString()
      });

      // 메시지 버퍼에 추가
      messageBuffer.unshift({ topic, message, timestamp });
      
      // 최대 개수 유지
      if (messageBuffer.length > MAX_MESSAGES) {
        messageBuffer.length = MAX_MESSAGES;
      }
    });

    client.on('error', (err) => {
      console.error('[MQTT Server] ❌ Connection error:', err);
      isConnecting = false;
    });

    client.on('close', () => {
      console.log('[MQTT Server] ⚠️ Connection closed');
      client = null;
      isConnecting = false;
    });

    client.on('reconnect', () => {
      console.log('[MQTT Server] 🔄 Reconnecting...');
    });

  } catch (err) {
    console.error('[MQTT Server] ❌ Failed to create client:', err);
    isConnecting = false;
  }

  return client;
}

/**
 * 버퍼에 저장된 메시지 가져오기
 */
export function getBufferedMessages(limit: number = 10) {
  return messageBuffer.slice(0, limit);
}

/**
 * 최신 메시지 가져오기
 */
export function getLatestMessage() {
  return messageBuffer[0] || null;
}

/**
 * 특정 시간 이후의 메시지 가져오기
 */
export function getMessagesSince(timestamp: number) {
  return messageBuffer.filter(msg => msg.timestamp > timestamp);
}

/**
 * 연결 상태 확인
 */
export function isConnected() {
  return client?.connected || false;
}

/**
 * 클라이언트 종료
 */
export function closeMqttClient() {
  if (client) {
    console.log('[MQTT Server] Closing connection');
    client.end();
    client = null;
  }
}

// 서버 시작 시 자동으로 연결
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  initMqttClient();
}

