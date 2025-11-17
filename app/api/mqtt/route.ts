/**
 * MQTT 메시지 API 엔드포인트
 * 서버에서 수신한 MQTT 메시지를 클라이언트에게 전달
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  initMqttClient, 
  getBufferedMessages, 
  getMessagesSince, 
  isConnected 
} from '@/lib/mqttServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mqtt
 * 버퍼에 저장된 MQTT 메시지 가져오기
 */
export async function GET(request: NextRequest) {
  try {
    // MQTT 클라이언트 초기화 (이미 연결되어 있으면 기존 연결 반환)
    initMqttClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const since = parseInt(searchParams.get('since') || '0');

    let messages;
    if (since > 0) {
      messages = getMessagesSince(since);
    } else {
      messages = getBufferedMessages(limit);
    }

    return NextResponse.json({
      success: true,
      connected: isConnected(),
      messages: messages.map(msg => ({
        topic: msg.topic,
        message: msg.message,
        timestamp: msg.timestamp
      })),
      count: messages.length
    });

  } catch (error) {
    console.error('[MQTT API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        connected: false,
        messages: [],
        count: 0
      },
      { status: 500 }
    );
  }
}

