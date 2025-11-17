/**
 * MQTT 메시지 관련 타입 정의
 */

export interface MqttContentData {
  status: number;
  location: string;
  entity_name: string;
}

export interface MqttCinData {
  ty: number;
  et: string;
  ct: string;
  lt: string;
  ri: string;
  rn: string;
  pi: string;
  st: number;
  lbl: string[];
  cs: number;
  con: MqttContentData;
}

export interface MqttNotification {
  fr: string;
  ri: string;
  op: number;
  pc: {
    'm2m:sgn': {
      nev: {
        rep: {
          'm2m:cin': MqttCinData;
        };
        sur: string;
        net: number;
      };
    };
  };
}

/**
 * MQTT 메시지에서 파싱된 업데이트 정보
 */
export interface MqttProcessUpdate {
  entityName: string;
  status: number; // enum 값 (1 = 정상, 1이 아닌 값 = 비정상)
  location: string;
  labels: string[];
  timestamp: string;
  // location 파싱 결과
  factory?: string;
  group?: string;
  processName?: string;
  machineId?: string;
}

/**
 * 실시간 알림 이벤트
 */
export interface AlertEvent {
  id: string;
  entityName: string;
  processName: string;
  status: number;
  statusText: string;
  location: string;
  timestamp: Date;
  labels: string[];
  machineId?: string;
}

