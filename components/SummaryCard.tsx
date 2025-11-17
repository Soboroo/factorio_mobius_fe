import React from 'react';
import { getStatusColor } from '@/utils/processUtils';

interface SummaryCardProps {
  title: string;
  value: string;
  percentage: number;
  onClick?: () => void;
}

/**
 * 요약 카드 컴포넌트
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  percentage,
  onClick 
}) => {
  const statusInfo = getStatusColor(percentage);
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`bg-slate-50 text-slate-800 border-2 ${statusInfo.border} rounded-lg px-4 py-3 text-center w-full transition ${
        onClick ? 'hover:bg-slate-200 cursor-pointer' : ''
      }`}
    >
      <div className="font-bold text-sm">{title}</div>
      <div className={`${statusInfo.color} text-lg font-bold`}>
        {percentage.toFixed(1)}%
      </div>
      <div className="text-xs text-slate-500 mt-1">{value}</div>
    </Component>
  );
};

