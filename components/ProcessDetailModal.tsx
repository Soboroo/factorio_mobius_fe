import React from 'react';
import { X } from 'lucide-react';
import { ProcessData } from '@/types/process';
import { getStatusColor } from '@/utils/processUtils';

interface ProcessDetailModalProps {
  processData: ProcessData[];
  onClose: () => void;
}

/**
 * 프로세스 상세 정보 모달
 */
export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  processData,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center z-50 p-6 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 max-w-7xl w-full border-4 border-slate-600 my-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-all shadow-lg z-10"
          title="Close"
        >
          <X size={28} strokeWidth={3} />
        </button>

        <h2 className="text-xl font-bold mb-6 text-slate-100">Process Details</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-7 gap-4 text-slate-400 text-sm pb-2 border-b border-slate-700">
            <div>Machine (Product)</div>
            <div>Status</div>
            <div className="col-span-2">Production Rate</div>
            <div>Current Output</div>
            <div>Target Output</div>
            <div>Power Usage</div>
          </div>

          {processData.map((process, index) => {
            const statusInfo = getStatusColor(process.percentage);
            return (
              <div
                key={index}
                className="grid grid-cols-7 gap-4 items-center py-2 border-b border-slate-700/50"
              >
                <div className="font-medium text-slate-100">
                  {process.name} ({process.productName})
                </div>
                <div className={statusInfo.color}>{statusInfo.status}</div>
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${statusInfo.bar}`}
                        style={{ width: `${process.percentage}%` }}
                      />
                    </div>
                    <span className={`${statusInfo.color} text-sm font-bold`}>
                      {process.percentage}%
                    </span>
                  </div>
                </div>
                <div className="text-slate-300 text-sm">{process.current}</div>
                <div className="text-slate-400 text-sm">{process.target}</div>
                <div className="text-blue-400 text-sm">{process.power}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

