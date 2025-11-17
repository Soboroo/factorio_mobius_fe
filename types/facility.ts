/**
 * 설비 관련 타입 정의
 */

export type FacilityType = 
  | 'boilers'
  | 'car_assemblers'
  | 'ironplate_electric_furnaces'
  | 'steelplate_electric_furnaces'
  | 'electric_mining_drills'
  | 'engineunit_assemblers'
  | 'irongearwheel_assemblers'
  | 'offshore_pumps'
  | 'pipe_assemblers'
  | 'steam_engines';

export const FACILITY_TYPES: FacilityType[] = [
  'boilers',
  'car_assemblers',
  'ironplate_electric_furnaces',
  'steelplate_electric_furnaces',
  'electric_mining_drills',
  'engineunit_assemblers',
  'irongearwheel_assemblers',
  'offshore_pumps',
  'pipe_assemblers',
  'steam_engines'
];

export const FACILITY_LABELS: Record<FacilityType, string> = {
  'boilers': 'Boilers',
  'car_assemblers': 'Car Assemblers',
  'ironplate_electric_furnaces': 'Iron Plate Electric Furnaces',
  'steelplate_electric_furnaces': 'Steel Plate Electric Furnaces',
  'electric_mining_drills': 'Electric Mining Drills',
  'engineunit_assemblers': 'Engine Unit Assemblers',
  'irongearwheel_assemblers': 'Iron Gear Wheel Assemblers',
  'offshore_pumps': 'Offshore Pumps',
  'pipe_assemblers': 'Pipe Assemblers',
  'steam_engines': 'Steam Engines'
};

/**
 * Mobius 응답 구조
 */
export interface MobiusContainer {
  ty: number;
  et: string;
  ct: string;
  lt: string;
  ri: string;
  rn: string;
  pi: string;
  cni: number;
  cbs: number;
  st: number;
  acpi: string[];
  mni: number;
  mbs: number;
  mia: number;
}

export interface MobiusFacilityResponse {
  'm2m:cnt': {
    'm2m:cnt': MobiusContainer[];
  };
}

/**
 * 설비 카운트
 */
export interface FacilityCount {
  facilityType: FacilityType;
  count: number;
  label: string;
}

/**
 * Factorio API 요청 구조
 */
export interface FactorioCalculationRequest {
  facilities: {
    assembling?: {
      [key: string]: number;
    };
    furnace?: {
      [key: string]: number;
    };
    mining?: {
      [key: string]: number;
    };
  };
  recipes: string[];
  target_item: string;
}

/**
 * Factorio API 응답 구조
 */
export interface FactorioCalculationResponse {
  success: boolean;
  target_item: string;
  theoretical_production: number;
  actual_production: number;
  efficiency: number;
  theoretical_production_per_minute: number;
  actual_production_per_minute: number;
  bottlenecks: string[];
  nominal_production_rates: { [key: string]: number };
  actual_production_rates: { [key: string]: number };
  consumption_rates: { [key: string]: number };
  material_wait_info: {
    [key: string]: {
      limiting_ingredient: string | null;
      supply_ratio: number;
      theoretical_rate: number;
      actual_rate: number;
      efficiency: number;
    };
  };
}

/**
 * 설비 효율성 정보
 */
export interface FacilityEfficiencyInfo extends FacilityCount {
  efficiency?: number;
  status?: string;
  loading: boolean;
  error?: string;
}

/**
 * 전체 생산 정보
 */
export interface ProductionInfo {
  success: boolean;
  efficiency: number;
  theoretical_production_per_minute: number;
  actual_production_per_minute: number;
  bottlenecks: string[];
  facilities: FacilityCount[];
  details?: FactorioCalculationResponse;
}

