/**
 * Mobius 관련 설정 상수
 */

export const DEFAULT_MOBIUS_DIRECT_URL = 'http://114.71.219.156:7599/Mobius/ae1';

const rawDirectUrls = process.env.NEXT_PUBLIC_MOBIUS_POLL_URLS ?? DEFAULT_MOBIUS_DIRECT_URL;
export const mobiusDirectTargets = rawDirectUrls
  .split(',')
  .map(url => url.trim())
  .filter(Boolean);

export const mobiusFetchMode = process.env.NEXT_PUBLIC_MOBIUS_FETCH_MODE || 'api';

export const mobiusDirectOrigin = 
  process.env.NEXT_PUBLIC_MOBIUS_POLL_ORIGIN ||
  process.env.NEXT_PUBLIC_MOBIUS_ORIGIN ||
  'SM';

export const mobiusDirectLimit = Number(
  process.env.NEXT_PUBLIC_MOBIUS_POLL_LIMIT ??
  process.env.NEXT_PUBLIC_MOBIUS_LIMIT ??
  '5'
);

export const mobiusDirectLevel = Number(
  process.env.NEXT_PUBLIC_MOBIUS_POLL_LEVEL ??
  process.env.NEXT_PUBLIC_MOBIUS_LEVEL ??
  '5'
);

export const useDirectMobiusFetch = 
  mobiusFetchMode !== 'api' && mobiusDirectTargets.length > 0;

// MQTT 설정 (서버 사이드용)
export const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://114.71.219.156:1883';
export const MQTT_TOPIC = process.env.MQTT_TOPIC || 'noti/event/json';

// 클라이언트는 서버 API를 통해 MQTT 메시지를 받음
export const enableServerMqtt = true;

/**
 * Mobius 폴링 간격 (밀리초)
 */
export const MOBIUS_POLLING_INTERVAL = 5000;

/**
 * 프로세스 데이터 업데이트 간격 (밀리초)
 */
export const PROCESS_UPDATE_INTERVAL = 3000;

/**
 * 최대 저장할 알림 개수
 */
export const MAX_ALERTS = 50;
