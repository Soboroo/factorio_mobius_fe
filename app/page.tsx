'use client';

import React, { useState, useEffect } from 'react';
import { Factory } from 'lucide-react';

// Types
import { ProcessData } from '@/types/process';
import { AlertEvent } from '@/types/mqtt';

// Utils
import { 
  updateProcessFromMqtt,
  matchProcessByEntityName
} from '@/utils/processUtils';
import { parseMqttMessage, mqttUpdateToAlertEvent } from '@/utils/mqttParser';

// Constants
import { getInitialProcessData } from '@/constants/initialData';
import {
  enableServerMqtt,
  MAX_ALERTS
} from '@/constants/mobiusConfig';
import { useMqttPolling } from '@/hooks/useMqttPolling';

// Components
import { AlertPanel } from '@/components/AlertPanel';
import { FacilityEfficiency } from '@/components/FacilityEfficiency';

/**
 * Factorio 생산 대시보드 메인 컴포넌트
 */
const FactoryDashboard: React.FC = () => {
  // State
  const [processData, setProcessData] = useState<ProcessData[]>(getInitialProcessData());
  const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);

  /**
   * MQTT 메시지 처리 - 유일한 데이터 소스
   */
  const handleMqttMessage = (topic: string, message: string) => {
    console.log('[MQTT] ========== New Message Received ==========');
    console.log('[MQTT] Topic:', topic);
    console.log('[MQTT] Raw message:', message.substring(0, 200) + '...');

    // 메시지 파싱
    const mqttUpdate = parseMqttMessage(message);
    if (!mqttUpdate) {
      console.warn('[MQTT] ❌ Failed to parse message');
      return;
    }

    console.log('[MQTT] ✅ Parsed update:', mqttUpdate);

    // 프로세스 찾기
    const matchedProcess = matchProcessByEntityName(processData, mqttUpdate.entityName);
    
    if (!matchedProcess) {
      console.warn('[MQTT] ⚠️ No matching process for:', mqttUpdate.entityName);
      console.log('[MQTT] Available processes:', processData.map(p => p.name));
      return;
    }

    console.log('[MQTT] ✅ Matched process:', matchedProcess.name);

    // status가 1이 아니면 비정상 이벤트
    if (mqttUpdate.status !== 1) {
      const alertEvent = mqttUpdateToAlertEvent(mqttUpdate, matchedProcess.name);
      console.log('[MQTT] 🚨 Alert event created:', alertEvent);
      
      setAlertEvents(prev => {
        const updated = [alertEvent, ...prev].slice(0, MAX_ALERTS);
        console.log('[MQTT] Alert events count:', updated.length);
        console.log('[MQTT] First alert:', updated[0]);
        return updated;
      });
    } else {
      console.log('[MQTT] ℹ️ Status is 1 (normal), no alert created');
    }

    // 프로세스 데이터 업데이트
    setProcessData(prevData => {
      return prevData.map(process => {
        if (process.name === matchedProcess.name) {
          const updated = updateProcessFromMqtt(process, mqttUpdate);
          console.log('[MQTT] 🔄 Process updated:', {
            name: updated.name,
            percentage: updated.percentage,
            status: updated.status
          });
          return updated;
        }
        return process;
      });
    });

    console.log('[MQTT] ========== Message Processing Complete ==========');
  };

  /**
   * MQTT 폴링 - 서버 API를 통해 메시지 수신
   */
  const { isConnected: mqttConnected, error: mqttError } = useMqttPolling({
    enabled: enableServerMqtt,
    interval: 1000, // 1초마다 폴링
    onMessage: handleMqttMessage
  });

  /**
   * MQTT 연결 상태 모니터링
   */
  useEffect(() => {
    if (enableServerMqtt) {
      console.log('[Dashboard] Server MQTT enabled');
      console.log('[Dashboard] Polling from: /api/mqtt');
    } else {
      console.warn('[Dashboard] MQTT is disabled');
    }
  }, [enableServerMqtt]);

  useEffect(() => {
    if (mqttConnected) {
      console.log('[Dashboard] ✅ Server MQTT Connected - Receiving messages');
    } else if (mqttError) {
      console.error('[Dashboard] ❌ MQTT Error:', mqttError);
    } else if (enableServerMqtt) {
      console.log('[Dashboard] ⏳ Waiting for server MQTT...');
    }
  }, [mqttConnected, mqttError, enableServerMqtt]);

  // ====================================================================
  // 데이터 계산
  // ====================================================================

  // 알림 데이터 - 실시간 MQTT 이벤트만 표시
  const recentAlertEvents = alertEvents.slice(0, 10);
  
  // 디버깅: alertEvents 변경 감지
  useEffect(() => {
    console.log('[Dashboard] Alert events updated, count:', alertEvents.length);
    if (alertEvents.length > 0) {
      console.log('[Dashboard] Latest alert:', alertEvents[0]);
    }
  }, [alertEvents]);

  // ====================================================================
  // 렌더링
  // ====================================================================

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Factory className="text-green-400" size={32} />
          <h1 className="text-2xl font-bold text-green-400">Factorio Production Dashboard</h1>
          {enableServerMqtt && (
            <div className="ml-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-slate-400">
                {mqttConnected ? 'MQTT 연결됨 (Server)' : mqttError ? `MQTT 오류: ${mqttError}` : 'MQTT 연결 중...'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="space-y-6">
          {/* Facility Efficiency */}
          <FacilityEfficiency autoRefresh={true} refreshInterval={30000} />
        </div>

        {/* Alert Aside */}
        <AlertPanel
          alertEvents={recentAlertEvents}
        />
      </div>
    </div>
  );
};

export default FactoryDashboard;
