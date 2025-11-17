import React from 'react';
import { PowerChartData } from '@/types/process';

interface PowerChartProps {
  data: PowerChartData[];
  totalPower: number;
}

/**
 * 전력 사용량 파이 차트 컴포넌트
 */
export const PowerChart: React.FC<PowerChartProps> = ({ data, totalPower }) => {
  // CSS Conic Gradient 생성
  let gradientString = 'conic-gradient(';
  let currentPercentage = 0;

  data.forEach(item => {
    const percentage = (item.power / (totalPower || 1)) * 100;
    if (percentage > 0) {
      gradientString += `${item.color} ${currentPercentage}% ${currentPercentage + percentage}%, `;
      currentPercentage += percentage;
    }
  });

  if (totalPower === 0) {
    gradientString += '#64748b 0% 100%)';
  } else {
    gradientString = gradientString.slice(0, -2) + ')';
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="text-slate-400 text-sm mb-3">
        Power Usage (Total {totalPower.toFixed(0)} kW)
      </div>
      <div className="flex items-center gap-4">
        <div
          className="rounded-full w-20 h-20 flex-shrink-0"
          style={{ background: gradientString }}
        />
        <div className="flex flex-col gap-1 text-xs">
          {data.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className={item.textColor}>
                {item.label} ({((item.power / (totalPower || 1)) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

