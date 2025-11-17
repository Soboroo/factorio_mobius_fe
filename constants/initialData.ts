import { ProcessData } from '@/types/process';
import { createMachines } from '@/utils/processUtils';

/**
 * 초기 프로세스 데이터 생성
 */
export const getInitialProcessData = (): ProcessData[] => [
  // Column 1: Power/Fuel
  {
    name: 'Water Pump',
    productName: 'Water',
    group: 'Power/Fuel',
    status: 'Normal',
    percentage: 98.0,
    current: '979.5 L/min',
    target: '1000 L/min',
    statusColor: 'text-green-400',
    barColor: 'bg-green-500',
    power: '15 kW',
    machineCount: 10,
    machines: createMachines(10, 10)
  },
  {
    name: 'Boiler',
    productName: 'Steam',
    group: 'Power/Fuel',
    status: 'Normal',
    percentage: 90.8,
    current: '726.3 kg/min',
    target: '800 kg/min',
    statusColor: 'text-green-400',
    barColor: 'bg-green-500',
    power: '12 kW',
    machineCount: 10,
    machines: createMachines(10, 10)
  },
  {
    name: 'Steam Engine',
    productName: 'Power',
    group: 'Power/Fuel',
    status: 'Normal',
    percentage: 90.6,
    current: '452.9 kW',
    target: '500 kW',
    statusColor: 'text-green-400',
    barColor: 'bg-green-500',
    power: '0 kW',
    machineCount: 10,
    machines: createMachines(10, 10)
  },
  
  // Column 2: Mining Drills
  {
    name: 'Coal Drill',
    productName: 'Coal',
    group: 'Mining Drill',
    status: 'Warning',
    percentage: 88.4,
    current: '176.9 kg/min',
    target: '200 kg/min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '8 kW',
    machineCount: 10,
    machines: createMachines(10, 8)
  },
  {
    name: 'Iron Drill',
    productName: 'Iron Ore',
    group: 'Mining Drill',
    status: 'Warning',
    percentage: 82.8,
    current: '248.4 kg/min',
    target: '300 kg/min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '20 kW',
    machineCount: 10,
    machines: createMachines(10, 7)
  },
  
  // Column 3: Engine Materials
  {
    name: 'Assembler (Engine)',
    productName: 'Iron Plate',
    group: 'Engine Materials',
    status: 'Warning',
    percentage: 83.7,
    current: '125.5 /min',
    target: '150 /min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '18 kW',
    machineCount: 10,
    machines: createMachines(10, 9)
  },
  {
    name: 'Pipe Assembler',
    productName: 'Pipe',
    group: 'Engine Materials',
    status: 'Warning',
    percentage: 78.2,
    current: '39.1 /min',
    target: '50 /min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '16 kW',
    machineCount: 10,
    machines: createMachines(10, 7)
  },
  {
    name: 'Steel Assembler (Engine)',
    productName: 'Steel Plate',
    group: 'Engine Materials',
    status: 'Warning',
    percentage: 77.7,
    current: '116.5 /min',
    target: '150 /min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '22 kW',
    machineCount: 10,
    machines: createMachines(10, 8)
  },
  {
    name: 'Engine Assembly',
    productName: 'Engine',
    group: 'Engine Materials',
    status: 'Critical',
    percentage: 67.8,
    current: '20.3 /min',
    target: '30 /min',
    statusColor: 'text-red-400',
    barColor: 'bg-red-500',
    power: '25 kW',
    machineCount: 10,
    machines: createMachines(10, 6)
  },
  
  // Column 4: Car Materials
  {
    name: 'Assembler (Car)',
    productName: 'Iron Plate',
    group: 'Car Materials',
    status: 'Warning',
    percentage: 80.1,
    current: '80.1 /min',
    target: '100 /min',
    statusColor: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    power: '18 kW',
    machineCount: 10,
    machines: createMachines(10, 8)
  },
  {
    name: 'Steel Assembler (Car)',
    productName: 'Steel Plate',
    group: 'Car Materials',
    status: 'Critical',
    percentage: 72.5,
    current: '43.5 /min',
    target: '60 /min',
    statusColor: 'text-red-400',
    barColor: 'bg-red-500',
    power: '22 kW',
    machineCount: 10,
    machines: createMachines(10, 7)
  },
  {
    name: 'Car Assembly',
    productName: 'Car',
    group: 'Car Assembly',
    status: 'Critical',
    percentage: 71.0,
    current: '7.1 /min',
    target: '10 /min',
    statusColor: 'text-red-400',
    barColor: 'bg-red-500',
    power: '20 kW',
    machineCount: 10,
    machines: createMachines(10, 7)
  }
];

