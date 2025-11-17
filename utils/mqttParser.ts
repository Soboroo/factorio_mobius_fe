import { MqttNotification, MqttProcessUpdate, AlertEvent } from '@/types/mqtt';

/**
 * MQTT 메시지 파싱
 */
export const parseMqttMessage = (message: string): MqttProcessUpdate | null => {
  try {
    const data: MqttNotification = JSON.parse(message);
    const cin = data.pc?.['m2m:sgn']?.nev?.rep?.['m2m:cin'];
    
    if (!cin || !cin.con) {
      console.warn('Invalid MQTT message structure', data);
      return null;
    }

    const { con, lbl, ct } = cin;
    const locationParts = parseLocation(con.location);

    return {
      entityName: con.entity_name,
      status: con.status,
      location: con.location,
      labels: lbl || [],
      timestamp: ct,
      ...locationParts
    };
  } catch (error) {
    console.error('Failed to parse MQTT message', error);
    return null;
  }
};

/**
 * status enum을 텍스트로 변환
 * 1 = 정상, 1이 아닌 값 = 비정상
 */
export const getStatusText = (status: number): string => {
  if (status === 1) return 'Normal';
  
  // 비정상 상태 코드 매핑 (실제 코드에 맞게 조정 필요)
  const statusMap: { [key: number]: string } = {
    0: 'Stopped',
    2: 'Error',
    3: 'Warning',
    4: 'Maintenance',
    5: 'Offline',
    26: 'Malfunction', // 예시 메시지의 status 값
  };
  
  return statusMap[status] || `Abnormal (${status})`;
};

/**
 * MQTT 업데이트를 AlertEvent로 변환
 */
export const mqttUpdateToAlertEvent = (
  update: MqttProcessUpdate,
  processName: string
): AlertEvent => {
  return {
    id: `${update.entityName}-${update.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
    entityName: update.entityName,
    processName: processName,
    status: update.status,
    statusText: getStatusText(update.status),
    location: update.location,
    timestamp: parseTimestamp(update.timestamp),
    labels: update.labels,
    machineId: update.machineId,
  };
};

/**
 * Mobius 타임스탬프 파싱 (20251117T143505 형식)
 */
export const parseTimestamp = (timestamp: string): Date => {
  try {
    // 20251117T143505 -> 2025-11-17T14:35:05
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    const second = timestamp.substring(13, 15);
    
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
  } catch (error) {
    console.error('Failed to parse timestamp:', timestamp, error);
    return new Date();
  }
};

/**
 * location 문자열 파싱
 * 예: "Mobius/ae1/factory_car/car_assemblers/car_assemblers_6730/sub1"
 */
export const parseLocation = (location: string) => {
  const parts = location.split('/');
  
  // Mobius/ae1을 제외한 나머지 파싱
  const relevantParts = parts.slice(2); // ['factory_car', 'car_assemblers', 'car_assemblers_6730', 'sub1']
  
  const result: {
    factory?: string;
    group?: string;
    processName?: string;
    machineId?: string;
  } = {};

  if (relevantParts[0]) {
    result.factory = relevantParts[0]; // factory_car
  }
  
  if (relevantParts[1]) {
    result.group = relevantParts[1]; // car_assemblers
  }
  
  if (relevantParts[2]) {
    result.processName = relevantParts[2]; // car_assemblers_6730
    // 마지막 숫자 부분을 machineId로 추출
    const match = relevantParts[2].match(/_(\d+)$/);
    if (match) {
      result.machineId = match[1]; // 6730
    }
  }

  return result;
};

/**
 * 그룹명을 표준 이름으로 매핑
 */
export const mapGroupName = (group?: string): string => {
  if (!group) return 'Unknown';
  
  const groupMapping: { [key: string]: string } = {
    'power': 'Power/Fuel',
    'fuel': 'Power/Fuel',
    'mining': 'Mining Drill',
    'mining_drill': 'Mining Drill',
    'engine': 'Engine Materials',
    'engine_materials': 'Engine Materials',
    'engine_assemblers': 'Engine Materials',
    'car': 'Car Materials',
    'car_materials': 'Car Materials',
    'car_assemblers': 'Car Assembly',
  };

  const key = group.toLowerCase().replace(/_/g, '_');
  return groupMapping[key] || group;
};

/**
 * 프로세스 이름을 표준 이름으로 매핑
 */
export const mapProcessName = (processName?: string): string => {
  if (!processName) return 'Unknown';
  
  // entity_name에서 의미있는 이름 추출
  const nameMapping: { [key: string]: string } = {
    'water_pump': 'Water Pump',
    'boiler': 'Boiler',
    'steam_engine': 'Steam Engine',
    'coal_drill': 'Coal Drill',
    'iron_drill': 'Iron Drill',
    'car_assemblers': 'Car Assembly',
    'engine_assemblers': 'Engine Assembly',
    'steel_assembler': 'Steel Assembler',
    'pipe_assembler': 'Pipe Assembler',
  };

  // 프로세스 이름에서 숫자 제거하고 매핑
  const baseName = processName.replace(/_\d+$/, '').toLowerCase();
  return nameMapping[baseName] || processName;
};

