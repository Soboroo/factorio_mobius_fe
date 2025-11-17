import React from 'react';
import { Machine } from '@/types/process';

interface MachineStatusProps {
  machines: Machine[];
  machineName: string;
}

/**
 * 머신 상태 표시 컴포넌트
 */
export const MachineStatus: React.FC<MachineStatusProps> = ({ machines, machineName }) => {
  const faultyCount = machines.filter(m => !m.working).length;

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xl font-bold text-slate-200">
          Machine Status ({machineName} - {machines.length})
        </span>
        <span className={`text-xl font-bold ${faultyCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
          Offline: {faultyCount}
        </span>
      </div>
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
        {machines.map(machine => (
          <div
            key={machine.id}
            className={`w-full h-8 flex items-center justify-center rounded-md text-xs font-bold transition-colors ${
              machine.working
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700 animate-pulse'
            }`}
            title={`Machine #${machine.id}: ${machine.working ? 'Online' : 'Offline'}`}
          >
            {machine.id}
          </div>
        ))}
      </div>
    </div>
  );
};

