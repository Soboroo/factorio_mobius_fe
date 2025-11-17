# Factory Dashboard - Real-time Event Monitoring System

실시간 공장 모니터링 대시보드 시스템

## 🎯 시스템 개요

이 대시보드는 **MQTT 기반 실시간 이벤트 모니터링 시스템**입니다.

### 핵심 원칙
- ✅ **MQTT만이 유일한 데이터 소스**
- ✅ **비정상 이벤트만 수신 및 표시**
- ✅ **시뮬레이션 없음, 실제 데이터만**
- ✅ **폴링 없음, 이벤트 기반만**

## 🚀 빠른 시작

### 1. 환경 설정

`.env.local` 파일 생성:

```env
# MQTT WebSocket 설정 (필수)
NEXT_PUBLIC_MQTT_WS_URL=ws://114.71.219.156:1884
NEXT_PUBLIC_MQTT_WS_TOPIC=noti/event/json
```

### 2. 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

## 📊 데이터 흐름

```
MQTT 브로커
    ↓
WebSocket 연결 (ws://114.71.219.156:1884)
    ↓
토픽: noti/event/json (비정상 이벤트만)
    ↓
handleMqttMessage()
    ↓
├─ parseMqttMessage()           # JSON 파싱
├─ matchProcessByEntityName()   # 프로세스 매칭
├─ updateProcessFromMqtt()      # 프로세스 업데이트
└─ mqttUpdateToAlertEvent()     # 알림 생성
    ↓
UI 실시간 업데이트
```

## 📁 프로젝트 구조

```
/
├── app/
│   ├── page.tsx                    # 메인 대시보드
│   └── api/                        # (사용 안 함)
├── components/
│   ├── AlertPanel.tsx              # 실시간 알림 패널
│   ├── ProductionFlow.tsx          # 생산 흐름도
│   ├── EfficiencyChart.tsx         # 효율성 차트
│   ├── PowerChart.tsx              # 전력 차트
│   └── *.tsx                       # 기타 UI 컴포넌트
├── types/
│   ├── mqtt.ts                     # MQTT 타입 정의
│   └── process.ts                  # 프로세스 타입 정의
├── utils/
│   ├── mqttParser.ts               # MQTT 메시지 파싱
│   └── processUtils.ts             # 프로세스 유틸리티
├── hooks/
│   └── useMqttConnection.ts        # MQTT 연결 Hook
├── constants/
│   ├── initialData.ts              # 초기 프로세스 데이터
│   └── mobiusConfig.ts             # 설정 상수
└── lib/                            # (레거시, 사용 안 함)
```

## 🔧 핵심 로직

### MQTT 메시지 처리

```typescript
const handleMqttMessage = (topic: string, message: string) => {
  // 1. 메시지 파싱
  const mqttUpdate = parseMqttMessage(message);
  
  // 2. 프로세스 찾기
  const matchedProcess = matchProcessByEntityName(processData, mqttUpdate.entityName);
  
  // 3. 비정상 이벤트면 알림 생성
  if (mqttUpdate.status !== 1) {
    const alertEvent = mqttUpdateToAlertEvent(mqttUpdate, matchedProcess.name);
    setAlertEvents(prev => [alertEvent, ...prev]);
  }
  
  // 4. 프로세스 업데이트
  setProcessData(prevData => 
    prevData.map(process => 
      process.name === matchedProcess.name 
        ? updateProcessFromMqtt(process, mqttUpdate)
        : process
    )
  );
};
```

### MQTT 메시지 형식

```json
{
  "pc": {
    "m2m:sgn": {
      "nev": {
        "rep": {
          "m2m:cin": {
            "con": {
              "status": 26,
              "location": "Mobius/ae1/factory_car/car_assemblers/car_assemblers_6730/sub1",
              "entity_name": "car_assemblers_6730"
            },
            "ct": "20251117T143505",
            "lbl": ["alert", "factory1"]
          }
        }
      }
    }
  }
}
```

### Status 코드

| 값 | 의미 | 처리 |
|----|------|------|
| 1 | 정상 | 이벤트 생성 안 함 |
| ≠ 1 | 비정상 | 알림 이벤트 생성 |

## 🎨 UI 구성

### 메인 대시보드
- **헤더**: MQTT 연결 상태 표시
- **4-Block 요약**: 생산 평균, 효율성, 상세 정보, 전력 사용
- **생산 흐름도**: 4개 컬럼 (Power/Fuel, Mining, Engine, Car)
- **알림 패널**: 실시간 이벤트 목록

### 알림 패널 (우측)
- 실시간 이벤트 카운트
- 최근 비정상 이벤트 목록
  - 프로세스 이름
  - 엔티티 이름
  - 머신 번호
  - 상태 텍스트
  - 발생 시간
- MQTT Raw 메시지 (디버깅용)

## 🔍 디버깅

### 콘솔 로그

```typescript
// MQTT 메시지 수신 시
[MQTT] Parsed update: { entityName, status, ... }
[MQTT] Matched process: "Car Assembly"
[MQTT] Alert event created: { ... }

// 연결 상태
[MobiusMQTT] Connected to broker
[MobiusMQTT] Subscribed to topic: noti/event/json
```

### 연결 상태 확인

- 🟢 초록색 점: "MQTT 연결됨"
- 🔴 빨간색 점: "MQTT 오류: ..."
- 🟡 노란색 점: "MQTT 연결 중..."

## 📝 상세 문서

- **[MQTT_SETUP.md](./MQTT_SETUP.md)**: MQTT 설정 가이드
- **[REALTIME_EVENT_SYSTEM.md](./REALTIME_EVENT_SYSTEM.md)**: 시스템 아키텍처

## ⚠️ 중요 사항

### 제거된 기능
- ❌ Mobius API 폴링
- ❌ 시뮬레이션 로직
- ❌ 랜덤 데이터 생성
- ❌ HTTP 요청 기반 데이터 fetching

### 유일한 데이터 소스
- ✅ **MQTT WebSocket만** 사용
- ✅ **비정상 이벤트만** 수신
- ✅ **실시간 처리만** 수행

## 🛠️ 기술 스택

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **MQTT Client**: mqtt.js (WebSocket)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react

## 📦 주요 의존성

```json
{
  "mqtt": "^5.x",
  "lucide-react": "^0.x",
  "next": "^15.x",
  "react": "^19.x"
}
```

## 🧪 테스트

```bash
# 빌드 테스트
npm run build

# 타입 체크
npm run type-check

# 린트 체크
npm run lint
```

## 🔒 보안 고려사항

- WebSocket URL은 환경 변수로 관리
- MQTT 브로커 인증 필요 시 추가 설정
- CORS 설정 확인 필요

## 📈 향후 개선 사항

- [ ] MQTT 재연결 전략 개선
- [ ] 이벤트 히스토리 DB 저장
- [ ] 상태 코드 매핑 UI에서 관리
- [ ] 알림 필터링 기능
- [ ] 이벤트 통계 및 분석

## 🤝 기여

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해주세요.

## 📄 라이선스

MIT License
