import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { AlertEvent } from '@/types/mqtt';

interface AlertPanelProps {
  alertEvents: AlertEvent[];
}

/**
 * 알림 패널 컴포넌트
 */
export const AlertPanel: React.FC<AlertPanelProps> = ({
  alertEvents
}) => {
  // 디버깅
  React.useEffect(() => {
    console.log('[AlertPanel] Received alertEvents:', alertEvents.length);
    console.log('[AlertPanel] Events:', alertEvents);
  }, [alertEvents]);

  return (
    <aside className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg sticky top-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-amber-400" size={24} />
        <p className="text-sm uppercase tracking-widest text-slate-400">Alert Monitor</p>
      </div>

      {/* 실시간 알림 이벤트 카운트 */}
      <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-4 text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-semibold">
          <AlertCircle size={18} /> 실시간 이벤트
        </div>
        <div className="text-4xl font-bold text-red-300 mt-2">
          {alertEvents.length}
        </div>
        <div className="text-xs text-slate-400 mt-1">비정상 동작 감지</div>
      </div>

      {/* 실시간 알림 이벤트 목록 */}
      <div>
        <p className="text-slate-300 text-sm mb-3">최근 비정상 이벤트</p>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alertEvents.map((event) => (
            <div
              key={event.id}
              className="border border-red-700/70 rounded-lg p-3 bg-red-900/20"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{event.processName}</p>
                  <p className="text-xs text-slate-400">{event.entityName}</p>
                  {event.machineId && (
                    <p className="text-xs text-amber-400 mt-1">Machine #{event.machineId}</p>
                  )}
                </div>
                <AlertCircle className="text-red-400" size={18} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-red-300 uppercase">
                  {event.statusText}
                </span>
                <span className="text-xs text-slate-500">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          {alertEvents.length === 0 && (
            <div className="text-slate-400 text-sm text-center py-6 border border-slate-700 rounded-lg">
              현재 이벤트가 없습니다.
            </div>
          )}
        </div>
      </div>

    </aside>
  );
};

