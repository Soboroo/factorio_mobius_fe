# 실시간 이벤트 시스템

## 개요

이 대시보드는 **실시간 이벤트 기반 모니터링 시스템**입니다. MQTT를 통해 비정상 동작 이벤트를 수신하고 즉시 UI에 반영합니다.

## 시스템 특징

### 1. 이벤트 기반 업데이트
- ❌ **시뮬레이션 없음**: 랜덤 데이터 생성 없음
- ✅ **실제 이벤트만**: MQTT로 수신된 실제 이벤트만 처리
- ✅ **즉시 반영**: 이벤트 수신 시 실시간 UI 업데이트

### 2. 비정상 이벤트 전용
- MQTT 토픽 `noti/event/json`은 **비정상 동작 이벤트만** 전송
- `status` 값이 1이 아닌 경우 비정상 상태로 판단
- 비정상 이벤트만 알림 패널에 표시

### 3. 머신 단위 추적
- `machineId`가 포함된 경우 특정 머신만 고장 처리
- 없는 경우 프로세스의 일부 머신을 고장 처리
- 머신 상태에 따라 생산율 자동 계산

## 데이터 흐름

```
MQTT 브로커 (mqtt://114.71.219.156:1883)
    ↓ WebSocket (ws://114.71.219.156:1884)
    ↓ 토픽: noti/event/json
    ↓
브라우저 MQTT 클라이언트
    ↓ parseMqttMessage()
    ↓
MqttProcessUpdate 객체
    ↓ matchProcessByEntityName()
    ↓
프로세스 찾기
    ↓ updateProcessFromMqtt()
    ↓
├─ 프로세스 데이터 업데이트
│   ├─ 머신 상태 변경
│   ├─ 생산율 재계산
│   └─ UI 반영
│
└─ 알림 이벤트 생성
    └─ 알림 패널에 표시
```

## 코드 구조

### 타입 정의 (`types/mqtt.ts`)
- `MqttNotification`: MQTT 메시지 구조
- `MqttProcessUpdate`: 파싱된 업데이트 데이터
- `AlertEvent`: 실시간 알림 이벤트

### 파서 (`utils/mqttParser.ts`)
- `parseMqttMessage()`: MQTT JSON 메시지 파싱
- `getStatusText()`: status enum → 텍스트 변환
- `mqttUpdateToAlertEvent()`: AlertEvent 생성
- `parseTimestamp()`: Mobius 타임스탬프 파싱

### 프로세스 업데이트 (`utils/processUtils.ts`)
- `updateProcessFromMqtt()`: 프로세스 데이터 업데이트
- `markMachineAsFaulty()`: 특정 머신 고장 처리
- `matchProcessByEntityName()`: entity_name으로 프로세스 찾기

### MQTT 연결 (`hooks/useMqttConnection.ts`)
- WebSocket MQTT 클라이언트
- 자동 재연결
- 연결 상태 관리

### UI 컴포넌트
- `AlertPanel`: 실시간 알림 패널
  - 이벤트 카운트 표시
  - 최근 이벤트 목록
  - Raw 메시지 표시

## 상태 관리

### State 변수

```typescript
// 프로세스 데이터 (머신 상태, 생산율 등)
const [processData, setProcessData] = useState<ProcessData[]>([...]);

// 실시간 알림 이벤트 (비정상 이벤트만)
const [alertEvents, setAlertEvents] = useState<AlertEvent[]>([]);

// MQTT Raw 메시지 (디버깅용)
const [mqttRawMessages, setMqttRawMessages] = useState<string[]>([]);
```

### 이벤트 처리

```typescript
const handleMqttMessage = (topic: string, message: string) => {
  // 1. Raw 메시지 저장
  setMqttRawMessages(prev => [message, ...prev].slice(0, 10));

  // 2. 메시지 파싱
  const mqttUpdate = parseMqttMessage(message);
  
  // 3. 프로세스 찾기
  const matchedProcess = matchProcessByEntityName(processData, mqttUpdate.entityName);
  
  // 4. 프로세스 업데이트
  setProcessData(prevData => 
    prevData.map(process => 
      process.name === matchedProcess.name 
        ? updateProcessFromMqtt(process, mqttUpdate)
        : process
    )
  );
  
  // 5. 비정상 이벤트면 알림 생성
  if (mqttUpdate.status !== 1) {
    const alertEvent = mqttUpdateToAlertEvent(mqttUpdate, matchedProcess.name);
    setAlertEvents(prev => [alertEvent, ...prev].slice(0, 50));
  }
};
```

## 커스터마이징

### 상태 코드 추가

`utils/mqttParser.ts`의 `getStatusText` 함수에서 상태 코드 매핑을 추가할 수 있습니다:

```typescript
const statusMap: { [key: number]: string } = {
  0: 'Stopped',
  2: 'Error',
  3: 'Warning',
  // 새로운 상태 코드 추가
  10: 'Overheating',
  11: 'Low Power',
  // ...
};
```

### 프로세스 매칭 규칙 변경

`utils/processUtils.ts`의 `matchProcessByEntityName` 함수에서 매칭 로직을 수정할 수 있습니다.

### 알림 이벤트 보관 개수 조정

`constants/mobiusConfig.ts`에서 상수 변경:

```typescript
export const MAX_ALERTS = 50; // 기본값
export const MAX_MQTT_RAW_MESSAGES = 10; // Raw 메시지
```

## 문제 해결

### MQTT 연결 안 됨
1. WebSocket 포트 확인 (기본 1884)
2. 브라우저 콘솔에서 연결 에러 확인
3. MQTT 브로커의 WebSocket 지원 여부 확인

### 이벤트가 표시되지 않음
1. MQTT 연결 상태 확인 (헤더의 초록 점)
2. Raw 메시지가 수신되는지 확인
3. entity_name이 프로세스와 매칭되는지 확인 (콘솔 로그)

### 머신 상태가 업데이트 안 됨
1. `machineId` 파싱 확인
2. `updateProcessFromMqtt` 로직 검토
3. 프로세스의 `machineCount` 확인

