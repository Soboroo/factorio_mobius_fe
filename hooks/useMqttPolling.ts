import { useEffect, useRef, useState } from 'react';

interface UseMqttPollingOptions {
  enabled: boolean;
  interval?: number;
  onMessage: (topic: string, message: string) => void;
}

/**
 * 서버 API를 통해 MQTT 메시지를 폴링하는 Hook
 * 브라우저에서 직접 MQTT(1883)를 사용할 수 없으므로
 * 서버 API를 통해 메시지를 가져옴
 */
export const useMqttPolling = ({
  enabled,
  interval = 1000,
  onMessage
}: UseMqttPollingOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastTimestamp = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      console.log('[MQTT Polling] Disabled');
      return;
    }

    console.log('[MQTT Polling] Starting with interval:', interval, 'ms');

    const fetchMessages = async () => {
      try {
        // 마지막 타임스탬프 이후의 메시지만 가져오기
        const url = lastTimestamp.current > 0 
          ? `/api/mqtt?since=${lastTimestamp.current}`
          : '/api/mqtt?limit=10';

        const response = await fetch(url, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        setIsConnected(data.connected);
        setError(null);

        if (data.messages && data.messages.length > 0) {
          console.log('[MQTT Polling] Received', data.messages.length, 'new messages');
          
          // 새 메시지 처리
          data.messages.forEach((msg: { topic: string; message: string; timestamp: number }) => {
            onMessage(msg.topic, msg.message);
            
            // 타임스탬프 업데이트
            if (msg.timestamp > lastTimestamp.current) {
              lastTimestamp.current = msg.timestamp;
            }
          });
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[MQTT Polling] Error:', errorMessage);
        setError(errorMessage);
        setIsConnected(false);
      }
    };

    // 즉시 한 번 실행
    fetchMessages();

    // 주기적으로 폴링
    intervalRef.current = setInterval(fetchMessages, interval);

    return () => {
      if (intervalRef.current) {
        console.log('[MQTT Polling] Stopped');
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, onMessage]);

  return { isConnected, error };
};

