# MQTT 설정 가이드

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Mobius API 설정
NEXT_PUBLIC_MOBIUS_POLL_URLS=http://114.71.219.156:7599/Mobius/ae1
NEXT_PUBLIC_MOBIUS_FETCH_MODE=api
NEXT_PUBLIC_MOBIUS_POLL_ORIGIN=SM
NEXT_PUBLIC_MOBIUS_POLL_LIMIT=5
NEXT_PUBLIC_MOBIUS_POLL_LEVEL=5

# MQTT WebSocket 설정
# WebSocket을 사용하려면 ws:// 프로토콜 사용 (브라우저에서)
NEXT_PUBLIC_MQTT_WS_URL=ws://114.71.219.156:1884
NEXT_PUBLIC_MQTT_WS_TOPIC=noti/event/json
```

## MQTT 메시지 형식

MQTT 브로커에서 다음과 같은 형식의 JSON 메시지를 수신합니다:

```json
{
  "fr": "/Mobius4",
  "ri": "mqtt-noti-y7w8178fvx",
  "op": 5,
  "pc": {
    "m2m:sgn": {
      "nev": {
        "rep": {
          "m2m:cin": {
            "ty": 4,
            "et": "20261117T143505",
            "ct": "20251117T143505",
            "lt": "20251117T143505",
            "ri": "phjgdk5uc2",
            "rn": "cin-qJXNVlRFpm",
            "pi": "1fbvnn1bm4",
            "st": 47,
            "lbl": ["alert", "factory1"],
            "cs": 170,
            "con": {
              "status": 26,
              "location": "Mobius/ae1/factory_car/car_assemblers/car_assemblers_6730/sub1",
              "entity_name": "car_assemblers_6730"
            }
          }
        },
        "sur": "Mobius/ae1/event/sub1",
        "net": 3
      }
    }
  }
}
```

### 주요 필드 설명

- `con.status`: 상태 enum 값 (**1 = 정상, 1이 아닌 값 = 비정상**)
  - 예: 26 = Malfunction (고장)
  - 이 토픽에는 **비정상 동작 이벤트만** 전송됨
- `con.location`: 프로세스 위치 경로
  - 형식: `Mobius/ae1/[factory]/[group]/[processName]/sub1`
  - machineId는 processName의 마지막 숫자에서 추출
- `con.entity_name`: 엔티티 이름 (프로세스와 매칭에 사용)
- `lbl`: 라벨 배열 (alert, factory1 등)
- `ct`: 생성 시간 (Mobius 타임스탬프 형식: 20251117T143505)

## 작동 방식

1. **MQTT 연결**: `useMqttConnection` 훅이 WebSocket을 통해 MQTT 브로커에 연결
2. **메시지 수신**: 토픽 `noti/event/json`에서 **비정상 동작 이벤트만** 수신
3. **메시지 파싱**: `parseMqttMessage`가 JSON 메시지를 파싱하여 `MqttProcessUpdate` 객체 생성
4. **상태 판별**: `status` 값이 1이 아니면 비정상 상태로 판단
5. **프로세스 매칭**: `matchProcessByEntityName`이 entity_name으로 프로세스 찾기
6. **상태 업데이트**: 
   - `machineId`가 있으면 해당 머신만 고장 처리
   - 없으면 프로세스의 일부 머신을 고장 처리
7. **알림 이벤트 생성**: 실시간 알림 패널에 이벤트 표시

## 프로세스 이름 매칭

MQTT의 `entity_name`을 대시보드의 프로세스와 매칭하기 위해 다음과 같이 정규화합니다:

- `car_assemblers_6730` → `car assemblers` (언더스코어를 공백으로, 숫자 제거)
- 대소문자 구분 없이 부분 문자열 매칭

### 예제

| MQTT entity_name | 매칭되는 프로세스 |
|-----------------|----------------|
| `car_assemblers_6730` | Car Assembly |
| `engine_assemblers_1234` | Engine Assembly |
| `coal_drill_5` | Coal Drill |
| `iron_drill_10` | Iron Drill |

## 상태 코드 매핑

기본적으로 다음과 같은 상태 코드를 지원합니다:

| Status 값 | 상태 텍스트 | 설명 |
|----------|----------|------|
| 1 | Normal | 정상 동작 (이 토픽에는 전송되지 않음) |
| 0 | Stopped | 정지 상태 |
| 2 | Error | 오류 |
| 3 | Warning | 경고 |
| 4 | Maintenance | 유지보수 |
| 5 | Offline | 오프라인 |
| 26 | Malfunction | 고장 (예시) |
| 기타 | Abnormal (n) | 비정상 (코드 값 표시) |

> **참고**: 실제 상태 코드는 시스템 설정에 따라 다를 수 있습니다. 
> `utils/mqttParser.ts`의 `getStatusText` 함수에서 매핑을 수정할 수 있습니다.

## 주의사항

1. **WebSocket 포트**: MQTT 브로커가 WebSocket을 지원하는지 확인 (기본 1884 포트)
2. **CORS 설정**: 브라우저에서 연결하므로 MQTT 브로커의 CORS 설정 필요
3. **실시간 이벤트 전용**: 
   - 시뮬레이션 로직은 완전히 제거됨
   - MQTT 메시지가 올 때만 상태 업데이트
   - **비정상 동작 이벤트만** 수신하고 처리

## 테스트

### MQTT 연결 상태
대시보드 헤더에 MQTT 연결 상태가 표시됩니다:
- 🟢 초록색: "MQTT 연결됨"
- 🔴 빨간색: "MQTT 오류: ..."
- 🟡 노란색: "MQTT 연결 중..."

### 실시간 이벤트 모니터링

알림 패널(우측)에서 다음 정보를 확인할 수 있습니다:

1. **실시간 이벤트 카운트**: 총 비정상 이벤트 수
2. **최근 비정상 이벤트 목록**:
   - 프로세스 이름
   - 엔티티 이름
   - 머신 번호 (있는 경우)
   - 상태 텍스트 (Malfunction, Error 등)
   - 발생 시간
3. **MQTT Raw 메시지**: 수신된 원본 메시지 (최근 10개)

### 프로세스 상태 변화

비정상 이벤트가 수신되면:
- 해당 프로세스의 머신 상태가 빨간색으로 표시
- 생산율이 자동으로 감소
- 현재 출력량이 재계산됨

