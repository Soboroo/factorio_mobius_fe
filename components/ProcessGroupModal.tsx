import React from 'react';
import { X, Factory } from 'lucide-react';
import { ProcessData } from '@/types/process';
import { MachineStatus } from './MachineStatus';

interface ProcessGroupModalProps {
  title: string;
  titleColor: string;
  processes: ProcessData[];
  onClose: () => void;
}

/**
 * 프로세스 그룹 모달 (Mining, Engine Materials, Car Materials 등)
 */
export const ProcessGroupModal: React.FC<ProcessGroupModalProps> = ({
  title,
  titleColor,
  processes,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 max-w-5xl w-full border-4 border-slate-600 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-all shadow-lg z-10"
          title="Close"
        >
          <X size={28} strokeWidth={3} />
        </button>

        <div className="pr-16">
          <h2 className="text-3xl font-bold flex items-center gap-3 mb-8">
            <Factory className={titleColor} size={40} />
            <span className={titleColor}>{title}</span>
          </h2>
          <div className="space-y-6">
            {processes.map((process, idx) => (
              <div key={idx} className="bg-slate-700 rounded-lg p-6 border-2 border-slate-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold">
                    {process.name} - {process.productName}
                  </h3>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${process.statusColor}`}>
                      {process.percentage}%
                    </div>
                    <div className="text-sm text-slate-400">
                      {process.current} / {process.target}
                    </div>
                    <div className="text-sm text-blue-400">{process.power}</div>
                  </div>
                </div>
                <MachineStatus machines={process.machines} machineName={process.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

