/**
 * 설비 정보 API
 * Mobius에서 각 설비의 개수를 가져오고 Factorio API로 효율성 정보를 조회
 */

import { NextResponse } from 'next/server';
import { FACILITY_TYPES, FACILITY_LABELS, type FacilityType } from '@/types/facility';

export const dynamic = 'force-dynamic';

const MOBIUS_BASE_URL = 'http://114.71.219.156:7599';
const FACTORIO_API_URL = process.env.FACTORIO_API_URL || 'http://localhost:8000';

/**
 * 특정 설비의 개수 조회
 */
async function getFacilityCount(facilityType: FacilityType): Promise<number> {
  try {
    const url = `${MOBIUS_BASE_URL}/Mobius/ae1/factory_car/${facilityType}?rcn=8&lvl=1&ty=3`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-M2M-Origin': 'SM',
        'X-M2M-RI': `req-${Date.now()}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`[Facilities] Failed to fetch ${facilityType}:`, response.status);
      return 0;
    }

    const data = await response.json();
    const containers = data['m2m:cnt']?.['m2m:cnt'];
    
    if (Array.isArray(containers)) {
      return containers.length;
    }
    
    return 0;
  } catch (error) {
    console.error(`[Facilities] Error fetching ${facilityType}:`, error);
    return 0;
  }
}

/**
 * 재료 이름을 한글 라벨로 변환
 */
function getMaterialLabel(materialName: string): string {
  const labels: { [key: string]: string } = {
    'iron-ore': 'Iron Ore',
    'iron-plate': 'Iron Plate',
    'steel-plate': 'Steel Plate',
    'iron-gear-wheel': 'Iron Gear Wheel',
    'pipe': 'Pipe',
    'engine-unit': 'Engine Unit',
    'car': 'Car'
  };
  return labels[materialName] || materialName;
}

/**
 * 설비 타입을 Factorio API 형식으로 매핑
 */
function mapFacilitiesToFactorioFormat(facilityCounts: Array<{ facilityType: FacilityType; count: number }>) {
  const facilities: any = {
    assembling: {},
    furnace: {},
    mining: {}
  };

  facilityCounts.forEach(({ facilityType, count }) => {
    switch (facilityType) {
      case 'car_assemblers':
        facilities.assembling['car'] = count;
        break;
      case 'engineunit_assemblers':
        facilities.assembling['engine-unit'] = count;
        break;
      case 'irongearwheel_assemblers':
        facilities.assembling['iron-gear-wheel'] = count;
        break;
      case 'pipe_assemblers':
        facilities.assembling['pipe'] = count;
        break;
      case 'ironplate_electric_furnaces':
        facilities.furnace['iron-plate'] = count;
        break;
      case 'steelplate_electric_furnaces':
        facilities.furnace['steel-plate'] = count;
        break;
      case 'electric_mining_drills':
        facilities.mining['iron-ore'] = count;
        break;
      // boilers, offshore_pumps, steam_engines는 전력 생산이므로 생략
    }
  });

  return facilities;
}

/**
 * Factorio API로 생산 계산 요청
 */
async function calculateProduction(facilityCounts: Array<{ facilityType: FacilityType; count: number }>) {
  try {
    console.log('[Facilities] Input facility counts:', facilityCounts);
    
    const facilities = mapFacilitiesToFactorioFormat(facilityCounts);
    
    console.log('[Facilities] Mapped facilities:', JSON.stringify(facilities, null, 2));
    
    const requestBody = {
      facilities,
      recipes: [
        'iron-ore',
        'iron-plate',
        'steel-plate',
        'iron-gear-wheel',
        'pipe',
        'engine-unit',
        'car'
      ],
      target_item: 'car'
    };

    console.log('[Facilities] Calling Factorio API with:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${FACTORIO_API_URL}/calculate-production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Facilities] Factorio API error:', response.status);
      const text = await response.text();
      console.error('[Facilities] Response:', text);
      return null;
    }

    const result = await response.json();
    console.log('[Facilities] Factorio API response:', JSON.stringify(result, null, 2));
    
    if (result.material_wait_info) {
      console.log('[Facilities] ========== Material Wait Info ==========');
      Object.keys(result.material_wait_info).forEach(key => {
        console.log(`[Facilities] ${key}:`, result.material_wait_info[key]);
      });
      console.log('[Facilities] =========================================');
    }
    
    return result;
  } catch (error) {
    console.error('[Facilities] Error calling Factorio API:', error);
    return null;
  }
}

/**
 * GET /api/facilities
 * 모든 설비의 개수와 효율성 정보 반환
 */
export async function GET() {
  try {
    console.log('[Facilities] Fetching facility counts...');

    // 모든 설비의 개수를 병렬로 조회
    const countPromises = FACILITY_TYPES.map(async (facilityType) => {
      const count = await getFacilityCount(facilityType);
      return {
        facilityType,
        count,
        label: FACILITY_LABELS[facilityType]
      };
    });

    const facilityCounts = await Promise.all(countPromises);
    
    console.log('[Facilities] ========== All Facility Counts ==========');
    facilityCounts.forEach(fc => {
      console.log(`[Facilities] ${fc.facilityType}: ${fc.count} (${fc.label})`);
    });
    console.log('[Facilities] ==========================================');

    // Factorio API로 생산 계산
    const productionData = await calculateProduction(facilityCounts);

    if (productionData && productionData.success) {
      // bottlenecks는 객체 배열이므로 item 속성만 추출
      const bottleneckItems = Array.isArray(productionData.bottlenecks) 
        ? productionData.bottlenecks.map((b: any) => b.item || b)
        : [];

      console.log('[Facilities] Bottleneck items:', bottleneckItems);

      // material_wait_info에서 재료별 정보 추출
      const materials = Object.entries(productionData.material_wait_info).map(([materialName, info]: [string, any]) => {
        const efficiency = (info.efficiency as number) * 100;
        let status = 'normal';
        
        // bottlenecks 배열에서 해당 재료의 상세 정보 찾기
        const bottleneckInfo = productionData.bottlenecks.find((b: any) => b.item === materialName);
        
        if (bottleneckInfo) {
          status = 'bottleneck';
        } else if (efficiency >= 95) {
          status = 'optimal';
        } else if (efficiency >= 70) {
          status = 'normal';
        } else {
          status = 'warning';
        }

        return {
          name: materialName,
          label: getMaterialLabel(materialName),
          efficiency,
          status,
          theoretical_rate: info.theoretical_rate as number,
          actual_rate: info.actual_rate as number,
          supply_ratio: info.supply_ratio as number,
          limiting_ingredient: info.limiting_ingredient as string | null,
          // 생산/소비 정보 추가
          produced: bottleneckInfo ? bottleneckInfo.produced : info.actual_rate,
          consumed: productionData.consumption_rates[materialName] || 0,
          shortage: bottleneckInfo ? bottleneckInfo.shortage : 0,
          utilization: bottleneckInfo ? bottleneckInfo.utilization : 100,
          loading: false
        };
      });

      return NextResponse.json({
        success: true,
        materials,
        production: {
          efficiency: productionData.efficiency * 100,
          theoretical_production_per_minute: productionData.theoretical_production_per_minute,
          actual_production_per_minute: productionData.actual_production_per_minute,
          bottlenecks: bottleneckItems, // 문자열 배열로 변환
          bottleneckDetails: productionData.bottlenecks, // 원본 객체 배열도 전달
          target_item: productionData.target_item
        },
        details: productionData,
        timestamp: Date.now()
      });
    } else {
      // Factorio API 실패 시 빈 배열 반환
      return NextResponse.json({
        success: true,
        materials: [],
        production: null,
        error: 'Failed to calculate production data',
        timestamp: Date.now()
      });
    }

  } catch (error) {
    console.error('[Facilities] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        facilities: []
      },
      { status: 500 }
    );
  }
}

