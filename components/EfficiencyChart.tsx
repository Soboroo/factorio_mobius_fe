import React from 'react';
import { EfficiencyData } from '@/types/process';
import { getStatusColor } from '@/utils/processUtils';

interface EfficiencyChartProps {
  data: EfficiencyData[];
}

/**
 * 효율성 바 차트 컴포넌트
 */
export const EfficiencyChart: React.FC<EfficiencyChartProps> = ({ data }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-slate-400 text-sm mb-3">Efficiency (Main Products)</div>
      <div className="flex flex-col gap-2">
        {data.map(item => {
          const statusInfo = getStatusColor(item.percentage);
          return (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-300 w-20">{item.label}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-3.5 overflow-hidden border border-slate-600">
                <div
                  className={`h-full ${statusInfo.bar} transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                  title={`${item.percentage.toFixed(1)}%`}
                />
              </div>
              <span className={`text-sm font-bold ${statusInfo.color} w-10 text-right`}>
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

