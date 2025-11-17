import { ProcessData, StatusInfo, Machine } from '@/types/process';
import { MqttProcessUpdate } from '@/types/mqtt';

/**
 * 생산율에 따른 상태 정보 반환
 */
export const getStatusColor = (rate: number): StatusInfo => {
  if (rate >= 90) {
    return {
      status: 'Normal',
      color: 'text-green-600',
      bar: 'bg-green-500',
      border: 'border-green-500'
    };
  }
  if (rate >= 75) {
    return {
      status: 'Warning',
      color: 'text-yellow-600',
      bar: 'bg-yellow-500',
      border: 'border-yellow-500'
    };
  }
  return {
    status: 'Critical',
    color: 'text-red-600',
    bar: 'bg-red-500',
    border: 'border-red-500'
  };
};

/**
 * 제품명으로 평균 효율 계산
 */
export const calculateAverageEfficiency = (
  processData: ProcessData[],
  productName: string
): number => {
  const processes = processData.filter(p => p.productName === productName);
  if (processes.length === 0) return 0;
  const totalPercentage = processes.reduce((sum, p) => sum + p.percentage, 0);
  return totalPercentage / processes.length;
};

/**
 * 전체 생산 평균 계산
 */
export const calculateOverallAverage = (processData: ProcessData[]): number => {
  if (processData.length === 0) return 0;
  const total = processData.reduce((sum, p) => sum + p.percentage, 0);
  return total / processData.length;
};

/**
 * 그룹별 총 전력 사용량 계산
 */
export const calculatePowerByGroup = (processData: ProcessData[]) => {
  return {
    'Power/Fuel': processData
      .filter(p => p.group === 'Power/Fuel')
      .reduce((sum, p) => sum + parseFloat(p.power), 0),
    'Mining Drill': processData
      .filter(p => p.group === 'Mining Drill')
      .reduce((sum, p) => sum + parseFloat(p.power), 0),
    'Engine Materials': processData
      .filter(p => p.group === 'Engine Materials')
      .reduce((sum, p) => sum + parseFloat(p.power), 0),
    'Car Materials': processData
      .filter(p => p.group === 'Car Materials' || p.group === 'Car Assembly')
      .reduce((sum, p) => sum + parseFloat(p.power), 0),
  };
};

/**
 * MQTT 이벤트로부터 프로세스에 영향을 받은 특정 머신만 고장으로 표시
 */
export const markMachineAsFaulty = (
  process: ProcessData,
  machineId?: string
): ProcessData => {
  if (!machineId) return process;

  const machineIdx = parseInt(machineId) % process.machineCount;
  if (machineIdx < 0 || machineIdx >= process.machineCount) return process;

  const newMachines = process.machines.map((m, idx) => ({
    ...m,
    working: idx !== machineIdx
  }));

  // 고장 머신 수에 따라 퍼센티지 재계산
  const workingCount = newMachines.filter(m => m.working).length;
  const newPercentage = (workingCount / process.machineCount) * 100;
  const statusInfo = getStatusColor(newPercentage);

  const targetNum = parseFloat(process.target.split(' ')[0]);
  const unit = process.current.split(' ')[1];
  const newCurrent = parseFloat(((targetNum * newPercentage) / 100).toFixed(1));
  const newCurrentString = `${newCurrent} ${unit}`;

  return {
    ...process,
    percentage: parseFloat(newPercentage.toFixed(1)),
    current: newCurrentString,
    status: statusInfo.status,
    statusColor: statusInfo.color,
    barColor: statusInfo.bar,
    machines: newMachines,
  };
};

/**
 * 머신 배열 생성 헬퍼
 */
export const createMachines = (count: number, workingCount: number): Machine[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    working: i < workingCount
  }));
};

/**
 * MQTT 메시지로부터 프로세스 데이터 업데이트
 * status가 1이 아니면 비정상 상태
 */
export const updateProcessFromMqtt = (
  process: ProcessData,
  mqttUpdate: MqttProcessUpdate
): ProcessData => {
  // status가 1이면 정상, 아니면 비정상
  const isNormal = mqttUpdate.status === 1;
  
  // machineId가 있으면 해당 머신만 고장 처리
  if (mqttUpdate.machineId && !isNormal) {
    return markMachineAsFaulty(process, mqttUpdate.machineId);
  }

  // machineId가 없으면 프로세스 전체에 영향
  if (!isNormal) {
    // 하나 이상의 머신을 고장으로 표시
    const faultyCount = Math.max(1, Math.floor(process.machineCount / 4));
    const newMachines = [...process.machines];
    
    for (let i = 0; i < faultyCount && i < newMachines.length; i++) {
      newMachines[i] = { ...newMachines[i], working: false };
    }

    const workingCount = newMachines.filter(m => m.working).length;
    const newPercentage = (workingCount / process.machineCount) * 100;
    const statusInfo = getStatusColor(newPercentage);

    const targetNum = parseFloat(process.target.split(' ')[0]);
    const unit = process.current.split(' ')[1];
    const newCurrent = parseFloat(((targetNum * newPercentage) / 100).toFixed(1));
    const newCurrentString = `${newCurrent} ${unit}`;

    return {
      ...process,
      percentage: parseFloat(newPercentage.toFixed(1)),
      current: newCurrentString,
      status: statusInfo.status,
      statusColor: statusInfo.color,
      barColor: statusInfo.bar,
      machines: newMachines,
    };
  }

  return process;
};

/**
 * 프로세스 이름과 MQTT entity_name 매칭
 */
export const matchProcessByEntityName = (
  processData: ProcessData[],
  entityName: string
): ProcessData | undefined => {
  // entity_name을 소문자로 변환하고 언더스코어를 공백으로
  const normalizedEntityName = entityName.toLowerCase().replace(/_/g, ' ').replace(/\d+$/, '').trim();
  
  return processData.find(process => {
    const normalizedProcessName = process.name.toLowerCase();
    return normalizedProcessName.includes(normalizedEntityName) || 
           normalizedEntityName.includes(normalizedProcessName.split(' ')[0].toLowerCase());
  });
};

/**
 * 그룹명으로 프로세스 찾기
 */
export const findProcessByGroup = (
  processData: ProcessData[],
  group: string
): ProcessData[] => {
  return processData.filter(p => p.group.toLowerCase().includes(group.toLowerCase()));
};

