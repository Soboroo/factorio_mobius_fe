// Process 관련 타입 정의

export interface Machine {
  id: number;
  working: boolean;
}

export interface ProcessData {
  name: string;
  productName: string;
  group: string;
  status: string;
  percentage: number;
  current: string;
  target: string;
  statusColor: string;
  barColor: string;
  power: string;
  machineCount: number;
  machines: Machine[];
}

export interface StatusInfo {
  status: string;
  color: string;
  bar: string;
  border: string;
}

export interface EfficiencyData {
  label: string;
  percentage: number;
}

export interface PowerChartData {
  label: string;
  power: number;
  color: string;
  textColor: string;
}

export type ProcessGroup = 'Power/Fuel' | 'Mining Drill' | 'Engine Materials' | 'Car Materials' | 'Car Assembly';

