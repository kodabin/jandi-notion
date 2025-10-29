# 잔디-노션 웹훅 통합 시스템 - Claude AI 컨텍스트

> 이 문서는 모든 Claude AI 요청에 자동으로 포함되어 프로젝트 컨텍스트를 제공합니다.

## ⚠️ 중요: 이 문서의 자동 수정 규칙 (RULE)

**Claude는 모든 작업 시 다음 규칙을 자동으로 실행해야 합니다:**

### 🔄 자동 실행 규칙 (매 작업마다)

**RULE 1: CLAUDE.md 자동 업데이트**
- 작업 완료 후 **항상** 이 문서를 검토하고 업데이트 필요 여부 확인
- 다음 경우 **즉시** 업데이트:
  1. ✅ 새 파일/API/환경변수 추가 시
  2. ✅ 프로젝트 구조 변경 시
  3. ✅ 의존성 패키지 추가/제거 시
  4. ✅ 데이터베이스 스키마 변경 시
  5. ✅ 중요한 제약사항 발견 시
  6. ✅ 반복적인 질문이 발생하는 경우

**RULE 2: 자동 Git Push & 배포**
- 작업 완료 후 **항상** 다음을 자동 실행:
  1. ✅ `git add .`
  2. ✅ `git commit -m "작업 내용 요약"`
  3. ✅ `git push origin main`
  4. ✅ GitHub Actions가 자동으로 Supabase + Vercel 배포

**실행 순서:**
```
작업 완료
  → CLAUDE.md 업데이트 (필요시)
  → npm run auto-deploy "작업 내용"
  → Git commit & push
  → GitHub Actions 자동 배포
  → 사용자에게 완료 보고
```

**자동 배포 명령어:**
```bash
# Claude가 작업 완료 후 자동 실행
npm run auto-deploy "feat: 새 기능 추가"
npm run auto-deploy "fix: 버그 수정"
npm run auto-deploy "docs: 문서 업데이트"
npm run auto-deploy "refactor: 리팩토링"
```

**수정 시 원칙:**
- CLAUDE.md 수정 시: "CLAUDE.md를 업데이트합니다" 알림
- Git push 시: "변경사항을 GitHub에 푸시합니다" 알림
- 배포 시: "GitHub Actions가 자동 배포를 시작합니다" 알림
- 모든 단계를 사용자에게 명확히 보고

---

## 📋 프로젝트 개요

**프로젝트명**: 잔디-노션 웹훅 통합 시스템
**목적**: 잔디(Jandi) 메신저 메시지를 ChatGPT로 요약하여 Notion에 자동 저장
**아키텍처**: Vercel Serverless Functions + Supabase PostgreSQL + OpenAI GPT-3.5-turbo + React

---

## 🏗 시스템 아키텍처

```
잔디 메신저 Webhook
    ↓
Vercel Serverless Function (/api/webhook/jandi)
    ↓
├─ ChatGPT API (요약 생성)
├─ Notion API (저장)
└─ Supabase (로그/상태 저장)
    ↓
React 관리자 대시보드 (/admin)
```

---

## 🛠 기술 스택

### Backend
- **런타임**: Node.js 18
- **플랫폼**: Vercel Serverless Functions
- **데이터베이스**: Supabase (PostgreSQL 15)
- **스토리지**: Supabase Storage

### Frontend
- **프레임워크**: React 18
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **빌드**: Create React App

### External APIs
- **AI**: OpenAI GPT-3.5-turbo (`openai`)
- **Notion**: Notion API (`@notionhq/client`)
- **Database**: Supabase (`@supabase/supabase-js`)

---

## 📁 프로젝트 구조

```
jandi-notion-webhook/
├── api/                        # Vercel Serverless Functions
│   ├── webhook/jandi.js        # 웹훅 수신 엔드포인트
│   ├── admin/
│   │   ├── webhooks.js         # 웹훅 목록 조회
│   │   └── retry-ai-summary.js # AI 요약 재생성
│   ├── logs.js                 # 로그 조회
│   ├── test-ai-summary.js      # AI 요약 테스트
│   ├── send-to-jandi.js        # 잔디 메시지 전송
│   └── _utils/                 # 공통 유틸리티
│       ├── openai.js           # OpenAI 클라이언트
│       ├── notion.js           # Notion API 클라이언트
│       ├── supabase.js         # Supabase 클라이언트
│       └── storage.js          # 저장소 추상화 (Supabase/메모리)
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MainPage.tsx    # 메인 페이지
│   │   │   └── AdminPage.tsx   # 관리자 대시보드
│   │   ├── components/         # 재사용 컴포넌트
│   │   ├── services/api.ts     # API 클라이언트
│   │   └── types/index.ts      # TypeScript 타입
│   └── public/                 # 정적 파일
│
├── supabase/
│   ├── migrations/             # DB 마이그레이션 SQL
│   └── config.toml             # Supabase 설정
│
├── .github/workflows/
│   └── deploy.yml              # GitHub Actions 자동 배포
│
├── scripts/
│   └── deploy.js               # 배포 자동화 스크립트
│
├── vercel.json                 # Vercel 설정
├── package.json                # 의존성 (백엔드)
├── .env                        # 환경변수 (로컬)
│
└── README.md                   # 프로젝트 문서
```

---

## 🗄 데이터베이스 스키마 (Supabase)

### webhooks 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| webhook_id | TEXT | 웹훅 고유 ID (UNIQUE) |
| status | TEXT | 상태 (received, completed 등) |
| team_name | TEXT | 잔디 팀 이름 |
| room_name | TEXT | 잔디 대화방 이름 |
| user_name | TEXT | 작성자 이름 |
| text | TEXT | 원본 메시지 |
| ai_summary | TEXT | ChatGPT 요약 |
| notion_page_id | TEXT | Notion 페이지 ID |
| created_at | TIMESTAMPTZ | 생성 시간 |
| updated_at | TIMESTAMPTZ | 수정 시간 |

### logs 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| webhook_id | TEXT | 관련 웹훅 ID |
| event_type | TEXT | 이벤트 타입 |
| data | JSONB | 이벤트 데이터 (JSON) |
| created_at | TIMESTAMPTZ | 생성 시간 |

### webhook_steps 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | Primary Key |
| webhook_id | TEXT | 웹훅 ID |
| step | TEXT | 단계 이름 |
| data | JSONB | 단계 데이터 (JSON) |
| created_at | TIMESTAMPTZ | 생성 시간 |

---

## 🔌 주요 API 엔드포인트

### 웹훅 수신
```javascript
POST /api/webhook/jandi
Body: {
  teamName: string,
  roomName: string,
  userName: string,
  text: string,
  createdAt: string (ISO 8601)
}
```

### 관리자 API
```javascript
GET  /api/admin/webhooks           // 웹훅 목록 조회
POST /api/admin/retry-ai-summary   // AI 요약 재생성
GET  /api/logs?limit=100           // 로그 조회
POST /api/test-ai-summary          // AI 요약 테스트
POST /api/send-to-jandi            // 잔디 메시지 전송
```

---

## 🔑 환경변수

### 필수 환경변수
```env
# OpenAI API
OPENAI_API_KEY=sk-...

# Notion API
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...

# Supabase
SUPABASE_URL=https://....supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 선택 환경변수
```env
# 잔디 Webhook (선택)
JANDI_WEBHOOK_TOKEN=...
JANDI_OUTGOING_WEBHOOK_URL=...
```

---

## 📦 주요 의존성

### Backend (package.json)
```json
{
  "openai": "^4.20.0",
  "@notionhq/client": "^2.2.13",
  "@supabase/supabase-js": "^2.76.1",
  "express": "^4.18.2",
  "axios": "^1.6.0",
  "dotenv": "^16.3.1"
}
```

### Frontend (frontend/package.json)
```json
{
  "react": "^18.2.0",
  "typescript": "^4.9.5",
  "tailwindcss": "^3.3.0"
}
```

---

## 🚀 배포 및 실행

### 로컬 개발
```bash
npm install
cd frontend && npm install && cd ..
npx vercel dev  # 또는 npm start
```

### 자동 배포
```bash
npm run deploy "커밋 메시지"
```
→ Git push → GitHub Actions → Supabase 마이그레이션 → Vercel 배포

---

## 💡 코드 작성 시 주의사항

### 1. Serverless Functions 제약
- **시간 제한**: 최대 10초 (Vercel Free tier)
- **상태 저장 불가**: 서버 메모리는 요청 간 공유되지 않음
- **파일 시스템**: 읽기 전용 (쓰기는 `/tmp`만 가능)
- **해결책**: 모든 데이터는 Supabase에 저장

### 2. 에러 처리
- 모든 API는 try-catch로 감싸고 적절한 HTTP 상태 코드 반환
- Supabase 연결 실패 시 메모리 저장소로 폴백
- 에러 로그는 Supabase `logs` 테이블에 기록

### 3. CORS 설정
- `vercel.json`에 CORS 헤더 설정 필수
- 모든 API 응답에 `Access-Control-Allow-Origin: *` 포함

### 4. TypeScript 타입
- Frontend는 TypeScript 사용
- `frontend/src/types/index.ts`에 공통 타입 정의
- API 응답 타입은 백엔드와 일치해야 함

### 5. 환경변수 접근
```javascript
// Backend (Node.js)
const apiKey = process.env.ANTHROPIC_API_KEY;

// Frontend (React)
const apiUrl = process.env.REACT_APP_API_URL;
```

---

## 🎯 개발 가이드라인

### API 응답 형식
```javascript
// 성공
res.status(200).json({
  success: true,
  data: { ... }
});

// 에러
res.status(500).json({
  success: false,
  error: "에러 메시지"
});
```

### 웹훅 처리 흐름
1. 웹훅 수신 → `webhook_id` 생성
2. Supabase `webhooks` 테이블에 저장 (status: 'received')
3. ChatGPT 요약 생성
4. Notion API 호출하여 페이지 생성
5. 상태 업데이트 (status: 'completed')
6. 각 단계별로 `logs` 및 `webhook_steps` 테이블에 기록

### 로깅 전략
```javascript
// 이벤트 로그 (Supabase logs 테이블)
await storage.addLog(webhookId, 'webhook_received', { data });

// 처리 단계 로그 (Supabase webhook_steps 테이블)
await storage.addWebhookStep(webhookId, 'ai_summary_start', { text });
```

---

## 🔍 디버깅 팁

### Vercel 로그 확인
```bash
vercel logs <deployment-url>
```

### Supabase 데이터 확인
- Supabase Dashboard → Table Editor → `webhooks`, `logs`, `webhook_steps`

### 로컬 테스트
```bash
# 웹훅 테스트
curl -X POST http://localhost:3000/api/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{"teamName":"테스트","roomName":"개발","userName":"테스터","text":"테스트","createdAt":"2025-10-29T00:00:00Z"}'

# AI 요약 테스트
curl -X POST http://localhost:3000/api/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트 메시지"}'
```

---

## 📚 참고 문서

### 프로젝트 문서
- **README.md**: 프로젝트 전체 개요
- **SUPABASE_SETUP.md**: Supabase 설정 가이드
- **SUPABASE_AUTO_DEPLOY.md**: 자동 배포 가이드
- **SYSTEM_PROMPT.md**: 시스템 전체 명세 (AI 개발용)
- **ADMIN_PROMPT.md**: 관리자 대시보드 명세 (AI 개발용)

### 외부 API 문서
- [OpenAI API](https://platform.openai.com/docs)
- [Notion API](https://developers.notion.com/)
- [Supabase](https://supabase.com/docs)
- [Vercel](https://vercel.com/docs)

---

## ✅ 코드 작성 체크리스트

사용자 요청을 처리할 때 다음을 확인하세요:

- [ ] Serverless 환경 제약 고려했는가?
- [ ] 에러 처리가 적절히 구현되었는가?
- [ ] 환경변수를 올바르게 사용하는가?
- [ ] CORS 설정이 필요한가?
- [ ] TypeScript 타입이 정의되었는가? (Frontend)
- [ ] API 응답 형식이 일관적인가?
- [ ] 로깅이 적절히 구현되었는가?
- [ ] 기존 코드 스타일과 일치하는가?
- [ ] 테스트 가능한 코드인가?

---

**마지막 업데이트**: 2025-10-29
**버전**: 3.0.0 (Vercel Serverless + Supabase + OpenAI GPT-3.5-turbo)
