import React from 'react';
import { ProcessData } from '@/types/process';
import { ProcessCard } from './ProcessCard';
import { SummaryCard } from './SummaryCard';
import { getStatusColor } from '@/utils/processUtils';

interface ProductionFlowProps {
  processData: ProcessData[];
  miningProcesses: ProcessData[];
  engineMaterialProcesses: ProcessData[];
  carMaterialProcesses: ProcessData[];
  onProcessClick: (name: string) => void;
  onGroupClick: (group: string) => void;
}

/**
 * 생산 흐름도 컴포넌트
 */
export const ProductionFlow: React.FC<ProductionFlowProps> = ({
  processData,
  miningProcesses,
  engineMaterialProcesses,
  carMaterialProcesses,
  onProcessClick,
  onGroupClick
}) => {
  // 그룹별 평균 계산
  const calculateGroupAverage = (processes: ProcessData[]) => {
    if (processes.length === 0) return 0;
    return processes.reduce((sum, p) => sum + p.percentage, 0) / processes.length;
  };

  const avgMiningRate = calculateGroupAverage(miningProcesses);
  const avgEngineRate = calculateGroupAverage(engineMaterialProcesses);
  const avgCarRate = calculateGroupAverage(carMaterialProcesses);

  const avgMiningStatusInfo = getStatusColor(avgMiningRate);
  const avgEngineStatusInfo = getStatusColor(avgEngineRate);
  const avgCarStatusInfo = getStatusColor(avgCarRate);

  return (
    <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
      <h2 className="text-2xl font-bold mb-8 text-slate-100">Production Flow</h2>

      <div className="grid grid-cols-4 gap-4">
        {/* Col 1: Power/Fuel */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-bold text-cyan-400 mb-2">⚡ Power/Fuel</div>
          {['Water Pump', 'Boiler', 'Steam Engine'].map(name => {
            const p = processData.find(item => item.name === name);
            if (!p) return null;
            return <ProcessCard key={p.name} process={p} onClick={() => onProcessClick(p.name)} />;
          })}
        </div>

        {/* Col 2: Mining Drills (Summary) */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-xl font-bold text-orange-400 mb-2">⛏️ Mining Drill</div>
          <SummaryCard
            title="Mining (Overall)"
            value={`${miningProcesses.length} Processes (Click)`}
            percentage={avgMiningRate}
            onClick={() => onGroupClick('Mining Drill')}
          />
        </div>

        {/* Col 3: Engine Assembly (Summary) */}
        <div className="flex flex-col items-center gap-2 border-l border-slate-700/50 pl-6">
          <div className="text-xl font-bold text-purple-400 mb-2">🔧 Engine Assembly</div>
          <SummaryCard
            title="Engine Materials"
            value={`${engineMaterialProcesses.length} Materials (Click)`}
            percentage={avgEngineRate}
            onClick={() => onGroupClick('Engine Materials')}
          />
          <div className="text-slate-400 text-sm my-1">↓</div>
          {processData
            .filter(p => p.name === 'Engine Assembly')
            .map(p => (
              <ProcessCard key={p.name} process={p} onClick={() => onProcessClick(p.name)} />
            ))}
        </div>

        {/* Col 4: Car Assembly (Summary) */}
        <div className="flex flex-col items-center gap-2 border-l border-slate-700/50 pl-6">
          <div className="text-xl font-bold text-pink-400 mb-2">🚗 Car Assembly</div>
          <SummaryCard
            title="Car Materials"
            value={`${carMaterialProcesses.length} Materials (Click)`}
            percentage={avgCarRate}
            onClick={() => onGroupClick('Car Materials')}
          />
          <div className="text-slate-400 text-sm my-1">↓</div>
          {processData
            .filter(p => p.name === 'Car Assembly')
            .map(p => (
              <ProcessCard key={p.name} process={p} onClick={() => onProcessClick(p.name)} />
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-8 mt-10 justify-center text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span>Normal (≥90%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded" />
          <span>Warning (75-89%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>Critical (&lt;75%)</span>
        </div>
      </div>
    </div>
  );
};

