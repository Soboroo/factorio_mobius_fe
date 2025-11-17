import React from 'react';
import { ProcessData } from '@/types/process';
import { getStatusColor } from '@/utils/processUtils';

interface ProcessCardProps {
  process: ProcessData;
  onClick: () => void;
}

/**
 * 프로세스 카드 컴포넌트
 */
export const ProcessCard: React.FC<ProcessCardProps> = ({ process, onClick }) => {
  const statusInfo = getStatusColor(process.percentage);

  return (
    <button
      onClick={onClick}
      className={`bg-slate-50 text-slate-800 border-2 ${statusInfo.border} rounded-lg px-4 py-2 text-center w-full hover:bg-slate-200 transition cursor-pointer mb-1`}
    >
      <div className="font-bold text-sm">{process.name}</div>
      <div className={`${statusInfo.color} text-lg font-bold`}>
        {process.percentage}%
      </div>
      <div className="text-xs text-slate-500 mt-1">{process.power}</div>
    </button>
  );
};

