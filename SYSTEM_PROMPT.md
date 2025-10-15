# 잔디-노션 웹훅 통합 시스템 - 싱글톤 프롬프트

## 메타 정보
- **버전**: 1.0.0
- **생성일**: 2025-10-10
- **멱등성**: 이 프롬프트는 항상 동일한 시스템을 생성합니다
- **원칙**: 싱글톤(Single-turn) - 프롬프트 한 번으로 전체 시스템 생성

---

## 1. 프로젝트 개요

### 1.1 목적
잔디(Jandi) 메신저의 Outgoing Webhook을 수신하여 AI 요약 후 Notion 데이터베이스에 자동 저장하는 통합 시스템

### 1.2 핵심 가치
- **자동화**: 잔디 메시지 → AI 요약 → Notion 저장 전 과정 자동화
- **투명성**: 모든 처리 단계를 시각화하여 추적 가능
- **유연성**: 각 단계별 재시도 가능
- **신뢰성**: 에러 처리 및 로깅 완비

---

## 2. 시스템 아키텍처

### 2.1 기술 스택
```yaml
Backend:
  - Runtime: Node.js 18+
  - Framework: Express.js
  - Language: JavaScript (ES6+)

Frontend:
  - Framework: React 18
  - Language: TypeScript
  - Build: Create React App

External APIs:
  - Notion API (@notionhq/client)
  - OpenAI API (gpt-3.5-turbo)

Infrastructure:
  - 환경변수 관리: dotenv
  - HTTP 클라이언트: axios
  - 로깅: JSON 파일 기반
```

### 2.2 데이터 플로우
```
[잔디 메신저]
    ↓ (Outgoing Webhook)
[Express 서버 수신] /webhook/jandi
    ↓
[1단계: 웹훅 수신 - 상태 추적 시작]
    ↓
[2단계: AI 요약 생성 - OpenAI API 호출]
    ↓
[3단계: Notion 저장 - Notion API 호출] (선택)
    ↓
[4단계: 완료 - 로그 저장]
```

---

## 3. Input/Output 명세

### 3.1 Input: 잔디 Webhook 구조
```json
{
  "token": "4a00f0161665d4745285ebd2d1b7f2c2",
  "teamName": "회사명",
  "roomName": "대화방명",
  "writer": {
    "id": 23356810,
    "name": "홍길동",
    "email": "hong@example.com",
    "phoneNumber": "010-1234-5678"
  },
  "writerName": "홍길동",
  "writerEmail": "hong@example.com",
  "text": "/키워드 메시지 본문 내용입니다",
  "data": "메시지 본문 내용입니다",
  "keyword": "키워드",
  "createdAt": "2025-10-10T00:22:04.167Z",
  "platform": "web",
  "ip": "14.52.239.5"
}
```

### 3.2 Output: Notion 페이지 생성 구조
```json
{
  "parent": {
    "database_id": "${NOTION_DATABASE_ID}"
  },
  "properties": {
    "제목": {
      "title": [{
        "text": {
          "content": "[대화방명] 메시지 요약..."
        }
      }]
    },
    "내용": {
      "rich_text": [{
        "text": {
          "content": "원본 메시지 전체 내용"
        }
      }]
    },
    "작성자": {
      "rich_text": [{
        "text": {
          "content": "홍길동"
        }
      }]
    },
    "대화방": {
      "select": {
        "name": "대화방명"
      }
    },
    "팀": {
      "select": {
        "name": "회사명"
      }
    },
    "작성일": {
      "date": {
        "start": "2025-10-10T00:22:04.167Z"
      }
    }
  },
  "children": [{
    "object": "block",
    "type": "paragraph",
    "paragraph": {
      "rich_text": [{
        "type": "text",
        "text": {
          "content": "원본 메시지:\n메시지 본문 내용입니다"
        }
      }]
    }
  }]
}
```

### 3.3 Output: AI 요약 요청/응답
```json
// 요청 (OpenAI API)
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "당신은 한국어 텍스트를 간결하게 요약하는 AI입니다. 핵심 내용을 1-2문장으로 요약해주세요."
    },
    {
      "role": "user",
      "content": "다음 텍스트를 요약해주세요:\n\n메시지 본문 내용입니다"
    }
  ],
  "max_tokens": 150,
  "temperature": 0.3
}

// 응답
{
  "choices": [{
    "message": {
      "content": "메시지의 핵심 내용을 1-2문장으로 요약한 결과입니다."
    }
  }]
}
```

---

## 4. 데이터 구조

### 4.1 웹훅 처리 상태 (In-Memory)
```javascript
// processingWebhooks: Map<string, WebhookState>
{
  id: "webhook_1760055724519_u0pi4o22d",
  startTime: "2025-10-10T00:22:04.519Z",
  currentStep: "ai_summary_complete", // received | ai_summary_start | ai_summary_complete | notion_save_start | notion_save_complete | completed | error
  steps: [
    {
      step: "received",
      timestamp: "2025-10-10T00:22:04.519Z",
      data: {
        text: "메시지 내용",
        userName: "홍길동",
        roomName: "대화방명",
        teamName: "회사명"
      }
    },
    {
      step: "ai_summary_start",
      timestamp: "2025-10-10T00:22:04.600Z",
      data: {}
    },
    {
      step: "ai_summary_complete",
      timestamp: "2025-10-10T00:22:06.200Z",
      data: {
        aiSummary: "AI가 생성한 요약 내용"
      }
    }
  ],
  data: {
    text: "메시지 내용",
    userName: "홍길동",
    roomName: "대화방명",
    teamName: "회사명",
    aiSummary: "AI가 생성한 요약 내용"
  }
}
```

### 4.2 로그 파일 구조 (webhook_logs.json)
```json
[
  {
    "timestamp": "2025-10-10T00:22:04.519Z",
    "eventType": "webhook_received",
    "webhookId": "webhook_1760055724519_u0pi4o22d",
    "data": {
      "token": "...",
      "teamName": "회사명",
      "roomName": "대화방명",
      "text": "메시지 내용",
      "createdAt": "2025-10-10T00:22:04.167Z"
    }
  },
  {
    "timestamp": "2025-10-10T00:22:06.200Z",
    "eventType": "ai_summary_generated",
    "webhookId": "webhook_1760055724519_u0pi4o22d",
    "data": {
      "originalText": "메시지 내용",
      "summary": "AI가 생성한 요약 내용",
      "author": "홍길동",
      "room": "대화방명"
    }
  },
  {
    "timestamp": "2025-10-10T00:22:07.000Z",
    "eventType": "webhook_processed",
    "webhookId": "webhook_1760055724519_u0pi4o22d",
    "data": {
      "message": "잔디 웹훅 수신 완료 (노션 연동 비활성화됨)",
      "aiSummary": "AI가 생성한 요약 내용"
    }
  }
]
```

---

## 5. API 명세

### 5.1 웹훅 수신 엔드포인트
```http
POST /webhook/jandi
Content-Type: application/json

Request Body: (잔디 웹훅 구조 - 3.1 참조)

Response (200 OK):
{
  "success": true,
  "message": "잔디 웹훅 데이터를 성공적으로 수신했습니다",
  "webhookId": "webhook_1760055724519_u0pi4o22d",
  "data": { /* 원본 웹훅 데이터 */ },
  "aiSummary": "AI가 생성한 요약 내용",
  "timing": {
    "webhookReceived": "2025-10-10T00:22:04.519Z"
  }
}

Response (500 Error):
{
  "success": false,
  "webhookId": "webhook_1760055724519_u0pi4o22d",
  "error": "에러 메시지"
}
```

### 5.2 웹훅 상태 조회 (Admin)
```http
GET /admin/webhooks

Response (200 OK):
{
  "processing": [
    {
      "id": "webhook_xxx",
      "startTime": "2025-10-10T00:22:04.519Z",
      "currentStep": "ai_summary_start",
      "steps": [ /* 단계 배열 */ ],
      "data": { /* 현재까지 수집된 데이터 */ }
    }
  ],
  "recent": [
    {
      "id": "webhook_yyy",
      "startTime": "2025-10-10T00:20:00.000Z",
      "currentStep": "completed",
      "steps": [ /* 단계 배열 */ ],
      "data": { /* 최종 데이터 */ }
    }
  ]
}
```

### 5.3 AI 요약 재생성
```http
POST /admin/retry-ai-summary
Content-Type: application/json

Request Body:
{
  "webhookId": "webhook_1760055724519_u0pi4o22d"
}

Response (200 OK):
{
  "success": true,
  "message": "AI 요약이 성공적으로 재생성되었습니다",
  "webhookId": "webhook_1760055724519_u0pi4o22d",
  "newSummary": "새로 생성된 AI 요약",
  "originalText": "원본 메시지 내용"
}

Response (404 Not Found):
{
  "success": false,
  "error": "웹훅 데이터를 찾을 수 없거나 텍스트가 없습니다"
}

Response (409 Conflict):
{
  "success": false,
  "error": "해당 웹훅이 아직 처리 중입니다"
}
```

### 5.4 테스트 엔드포인트
```http
POST /test-ai-summary
Content-Type: application/json

Request Body:
{
  "text": "요약할 텍스트 내용"
}

Response (200 OK):
{
  "success": true,
  "message": "AI 요약 생성 성공",
  "originalText": "요약할 텍스트 내용",
  "summary": "생성된 요약"
}
```

### 5.5 잔디 메시지 전송
```http
POST /send-to-jandi
Content-Type: application/json

Request Body:
{
  "body": "전송할 메시지 본문",
  "connectColor": "#FAC11B",
  "connectInfo": {
    "title": "제목",
    "description": "설명"
  }
}

Response (200 OK):
{
  "success": true,
  "message": "잔디로 메시지가 성공적으로 전송되었습니다",
  "sentData": { /* 전송된 데이터 */ }
}
```

---

## 6. 환경변수 명세

### 6.1 필수 환경변수
```env
# 서버 설정
PORT=3000

# Notion API 설정 (필수)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API 설정 (AI 요약용, 선택)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 잔디 Webhook 설정 (선택)
JANDI_WEBHOOK_TOKEN=your_secret_token_here
JANDI_OUTGOING_WEBHOOK_URL=https://wh.jandi.com/connect-api/webhook/xxxxx/xxxxxxxxx
```

### 6.2 환경변수 사용 규칙
- `NOTION_API_KEY`가 없으면 서버 시작 시 경고 표시
- `OPENAI_API_KEY`가 없으면 AI 요약 기능 비활성화 (null 반환)
- `JANDI_OUTGOING_WEBHOOK_URL`이 없으면 잔디 메시지 전송 기능 비활성화

---

## 7. 프로세스 단계 정의

### 7.1 웹훅 처리 단계
```javascript
const WEBHOOK_STEPS = {
  RECEIVED: 'received',              // 웹훅 수신 완료
  AI_SUMMARY_START: 'ai_summary_start',     // AI 요약 시작
  AI_SUMMARY_COMPLETE: 'ai_summary_complete', // AI 요약 완료
  NOTION_SAVE_START: 'notion_save_start',   // Notion 저장 시작
  NOTION_SAVE_COMPLETE: 'notion_save_complete', // Notion 저장 완료
  COMPLETED: 'completed',             // 전체 처리 완료
  ERROR: 'error'                      // 에러 발생
};
```

### 7.2 단계별 처리 로직

#### RECEIVED (웹훅 수신)
- 고유 ID 생성: `webhook_${timestamp}_${random}`
- 상태 추적 맵에 등록
- 로그 저장: `webhook_received`
- 다음 단계로 자동 진행

#### AI_SUMMARY_START (AI 요약 시작)
- 원본 텍스트 10자 미만이면 "요약할 내용이 너무 짧습니다" 반환
- OpenAI API 호출 시작
- 타임아웃: 30초
- 에러 발생 시 ERROR 단계로 이동

#### AI_SUMMARY_COMPLETE (AI 요약 완료)
- 요약 결과를 상태에 저장
- 로그 저장: `ai_summary_generated`
- 다음 단계로 자동 진행

#### NOTION_SAVE_START (Notion 저장 시작) - 현재 비활성화
- Notion API 호출 전 상태 업데이트
- 로그 저장: `notion_save_start`

#### NOTION_SAVE_COMPLETE (Notion 저장 완료) - 현재 비활성화
- Notion 페이지 ID 저장
- 로그 저장: `notion_save_complete`

#### COMPLETED (완료)
- 최종 상태 업데이트
- 로그 저장: `webhook_processed`
- 5분 후 메모리에서 자동 제거

#### ERROR (에러)
- 에러 메시지 저장
- 로그 저장: `webhook_error`
- 5분 후 메모리에서 자동 제거

---

## 8. 재시도 정책

### 8.1 AI 요약 재시도 규칙
```javascript
// 재시도 가능 조건
- 웹훅 ID가 로그에 존재
- 원본 텍스트가 존재
- 현재 처리 중이 아니거나 완료/에러 상태

// 재시도 불가 조건
- 웹훅 ID를 찾을 수 없음 → 404 에러
- 아직 처리 중 → 409 Conflict 에러
- 원본 텍스트 없음 → 404 에러
```

### 8.2 재시도 시 동작
1. 기존 웹훅 상태 확인
2. 로그에서 원본 데이터 로드
3. 새로운 처리 상태 생성 (`isRetry: true` 플래그)
4. AI 요약 재실행
5. 재생성 로그 저장: `ai_summary_regenerated`

---

## 9. 에러 처리

### 9.1 에러 타입별 처리
```javascript
// OpenAI API 에러
catch (error) {
  console.error('❌ AI 요약 실패:', error.message);
  return '요약 생성에 실패했습니다.';
}

// Notion API 에러
catch (error) {
  console.error('❌ 노션 저장 실패:', error);
  updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
    error: error.message
  });
  await saveLog({
    error: error.message,
    webhookData: req.body
  }, 'webhook_error', webhookId);
}

// 파일 시스템 에러
catch (error) {
  console.error('로그 저장 실패:', error);
  // 치명적이지 않으므로 계속 진행
}
```

### 9.2 에러 로깅 구조
```json
{
  "timestamp": "2025-10-10T00:22:07.000Z",
  "eventType": "webhook_error",
  "webhookId": "webhook_xxx",
  "data": {
    "error": "상세 에러 메시지",
    "webhookData": { /* 원본 웹훅 데이터 */ }
  }
}
```

---

## 10. 프론트엔드 명세

### 10.1 페이지 구조
```
/                    → MainPage (메인 페이지)
/admin               → AdminPage (어드민 대시보드)
```

### 10.2 MainPage 기능
- 잔디로 메시지 전송 (테스트용)
- AI 요약 테스트
- 웹훅 테스트
- 로그 조회

### 10.3 AdminPage 기능
- 실시간 웹훅 모니터링
- 처리 중인 웹훅 목록
- 최근 완료된 웹훅 목록 (최대 10개)
- 각 웹훅별 단계 시각화
- AI 요약 재생성 버튼

### 10.4 AdminPage UI 요구사항
```typescript
// 웹훅 카드 UI
interface WebhookCard {
  webhookId: string;
  status: 'processing' | 'completed' | 'error';
  steps: Array<{
    name: string;
    status: 'completed' | 'in_progress' | 'pending' | 'error';
    timestamp?: string;
  }>;
  data: {
    text: string;
    userName: string;
    roomName: string;
    aiSummary?: string;
  };
  actions: {
    retryAiSummary: () => void;
  };
}

// 단계별 색상
const STEP_COLORS = {
  completed: '#22c55e',   // 녹색
  in_progress: '#3b82f6', // 파란색
  pending: '#94a3b8',     // 회색
  error: '#ef4444'        // 빨간색
};
```

---

## 11. 배포 고려사항

### 11.1 로컬 개발
```bash
# 1. 의존성 설치
npm install
cd frontend && npm install && cd ..

# 2. 프론트엔드 빌드
cd frontend && npm run build && cd ..

# 3. 서버 실행
node server.js

# 4. ngrok 터널 (외부 접속용)
ngrok http 3000
```

### 11.2 프로덕션 배포 (추후)
- Docker 컨테이너화
- 환경별 설정 분리 (dev/staging/prod)
- CI/CD 파이프라인 구성
- 로그 파일을 데이터베이스로 마이그레이션

---

## 12. 보안 고려사항

### 12.1 환경변수 보호
- `.env` 파일을 Git에 커밋하지 않음
- `.gitignore`에 `.env`, `webhook_logs.json` 추가

### 12.2 토큰 검증 (현재 비활성화)
```javascript
// 프로덕션에서 활성화 필요
if (process.env.JANDI_WEBHOOK_TOKEN && token !== process.env.JANDI_WEBHOOK_TOKEN) {
  console.error('❌ 토큰 검증 실패');
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### 12.3 Rate Limiting (추후 구현)
- Express rate limiter 미들웨어 추가
- IP별 요청 제한

---

## 13. 테스트 시나리오

### 13.1 기본 웹훅 수신 테스트
```bash
curl -X POST http://localhost:3000/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{
    "token": "test_token",
    "teamName": "테스트팀",
    "roomName": "테스트룸",
    "writerName": "홍길동",
    "text": "테스트 메시지입니다. 이 메시지는 AI에 의해 요약될 것입니다.",
    "createdAt": "2025-10-10T00:00:00Z"
  }'
```

### 13.2 AI 요약 테스트
```bash
curl -X POST http://localhost:3000/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{
    "text": "오늘 회의에서 새로운 프로젝트에 대해 논의했습니다. 주요 안건은 UI 개선과 성능 최적화였습니다."
  }'
```

### 13.3 AI 요약 재생성 테스트
```bash
curl -X POST http://localhost:3000/admin/retry-ai-summary \
  -H "Content-Type: application/json" \
  -d '{
    "webhookId": "webhook_1760055724519_u0pi4o22d"
  }'
```

---

## 14. 유지보수 가이드

### 14.1 로그 관리
- `webhook_logs.json`은 최근 100개 항목만 유지
- 오래된 로그는 자동 삭제
- 프로덕션에서는 로그 로테이션 구현 권장

### 14.2 메모리 관리
- 완료/에러 상태의 웹훅은 5분 후 메모리에서 자동 제거
- `processingWebhooks` Map 크기 모니터링 필요

### 14.3 Notion 데이터베이스 속성 변경 시
`server.js`의 `notionData` 구조를 수정:
```javascript
properties: {
  '제목': { title: [...] },
  '내용': { rich_text: [...] },
  // 새 속성 추가
  '우선순위': {
    select: {
      name: '높음'
    }
  }
}
```

---

## 15. 알려진 제약사항

### 15.1 현재 비활성화된 기능
- Notion API 연동 (코드는 있으나 주석 처리됨)
- 잔디 토큰 검증 (테스트 편의를 위해 비활성화)

### 15.2 기술적 제약
- AI 요약은 OpenAI API 키가 설정된 경우만 작동
- 로그는 JSON 파일 기반 (대규모 트래픽에 부적합)
- 실시간 업데이트는 폴링 방식 (SSE/WebSocket 미사용)

### 15.3 개선 가능 영역
- 데이터베이스 도입 (PostgreSQL/MongoDB)
- WebSocket 기반 실시간 업데이트
- 사용자 인증 및 권한 관리
- 대시보드 UI/UX 고도화

---

## 16. FAQ

### Q1: AI 요약이 생성되지 않습니다
**A**: `.env` 파일의 `OPENAI_API_KEY`가 올바르게 설정되었는지 확인하세요.

### Q2: Notion에 저장되지 않습니다
**A**: 현재 Notion 연동이 비활성화되어 있습니다. `server.js` 357-413행의 주석을 해제하세요.

### Q3: ngrok URL로 접속 시 웹훅이 수신되지 않습니다
**A**:
- ngrok이 실행 중인지 확인
- 잔디 Outgoing Webhook URL이 `https://your-ngrok-url.ngrok.io/webhook/jandi`인지 확인
- 서버 로그에서 실제 요청이 들어오는지 확인

### Q4: 프론트엔드가 표시되지 않습니다
**A**: `frontend/build` 폴더가 있는지 확인. 없으면 `cd frontend && npm run build`

---

## 17. 변경 이력

### v1.0.0 (2025-10-10)
- 초기 싱글톤 프롬프트 작성
- Express + React 기반 시스템
- AI 요약 기능 구현
- 어드민 대시보드 (기본)
- 웹훅 처리 단계 추적

---

## 18. 라이센스 및 기여

### 18.1 라이센스
MIT License

### 18.2 기여 가이드
싱글톤 원칙에 따라:
1. 이 프롬프트 파일을 수정
2. 전체 시스템을 재생성
3. 테스트 통과 확인
4. Pull Request 제출

---

**문서 종료**
