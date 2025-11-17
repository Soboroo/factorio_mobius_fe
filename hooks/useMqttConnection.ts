import { useEffect, useRef, useState } from 'react';
import mqtt, { MqttClient } from 'mqtt';

interface UseMqttConnectionOptions {
  url: string;
  topic: string;
  enabled: boolean;
  onMessage: (topic: string, message: string) => void;
}

/**
 * MQTT WebSocket 연결 Hook
 */
export const useMqttConnection = ({
  url,
  topic,
  enabled,
  onMessage
}: UseMqttConnectionOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    if (!enabled || !url || !topic) {
      return;
    }

    try {
      console.log('Connecting to MQTT broker:', url);
      const client = mqtt.connect(url, {
        clean: true,
        reconnectPeriod: 5000,
      });

      client.on('connect', () => {
        console.log('Connected to MQTT broker');
        setIsConnected(true);
        setError(null);
        
        client.subscribe(topic, (err) => {
          if (err) {
            console.error('Failed to subscribe to topic:', topic, err);
            setError(`Failed to subscribe: ${err.message}`);
          } else {
            console.log('Subscribed to topic:', topic);
          }
        });
      });

      client.on('message', (receivedTopic, payload) => {
        const message = payload.toString();
        console.log('MQTT message received:', receivedTopic, message);
        onMessage(receivedTopic, message);
      });

      client.on('error', (err) => {
        console.error('MQTT connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      client.on('close', () => {
        console.log('MQTT connection closed');
        setIsConnected(false);
      });

      clientRef.current = client;

      return () => {
        if (client) {
          console.log('Disconnecting from MQTT broker');
          client.end();
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to connect to MQTT:', errorMessage);
      setError(errorMessage);
    }
  }, [url, topic, enabled]);

  return { isConnected, error };
};

