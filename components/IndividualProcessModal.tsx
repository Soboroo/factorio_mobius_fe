import React from 'react';
import { X, Factory } from 'lucide-react';
import { ProcessData } from '@/types/process';
import { MachineStatus } from './MachineStatus';

interface IndividualProcessModalProps {
  process: ProcessData;
  onClose: () => void;
}

/**
 * 개별 프로세스 상세 모달
 */
export const IndividualProcessModal: React.FC<IndividualProcessModalProps> = ({
  process,
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
            <Factory className={process.statusColor} size={40} />
            <span className={process.statusColor}>{process.name} Details</span>
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-slate-400 text-lg">
                Product: <span className="text-slate-200 font-bold">{process.productName}</span>
              </div>
              <div className="text-slate-400 text-lg">
                Status: <span className={process.statusColor}>{process.status}</span>
              </div>
              <div className="text-slate-400 text-lg">
                Power Usage: <span className="text-blue-400 font-bold">{process.power}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-extrabold ${process.statusColor}`}>
                {process.percentage}%
              </div>
              <div className="text-lg text-slate-300">
                {process.current} / {process.target}
              </div>
            </div>
          </div>
          <MachineStatus machines={process.machines} machineName={process.name} />
        </div>
      </div>
    </div>
  );
};

