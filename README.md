# 잔디-노션 웹훅 통합 시스템

<div align="center">

**잔디(Jandi) 메신저의 메시지를 AI로 요약하여 Notion에 자동 저장하는 통합 시스템**

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📋 목차

- [개요](#-개요)
- [주요 기능](#-주요-기능)
- [아키텍처](#-아키텍처)
- [빠른 시작](#-빠른-시작)
- [환경 설정](#-환경-설정)
- [API 문서](#-api-문서)
- [싱글톤 프롬프트 개발](#-싱글톤-프롬프트-개발)
- [프로젝트 구조](#-프로젝트-구조)
- [테스트](#-테스트)
- [배포](#-배포)
- [문제 해결](#-문제-해결)
- [기여하기](#-기여하기)
- [라이센스](#-라이센스)

---

## 🎯 개요

이 프로젝트는 **싱글톤(Single-turn) 프롬프트 방식**으로 개발된 잔디-노션 통합 시스템입니다.

### 핵심 가치
- 🤖 **AI 자동 요약**: OpenAI GPT-3.5-turbo를 사용한 메시지 요약
- 📊 **실시간 모니터링**: 웹훅 처리 과정을 단계별로 추적
- 🔄 **재시도 기능**: AI 요약 결과가 마음에 안 들면 언제든 재생성
- 📝 **투명한 로깅**: 모든 처리 단계를 JSON 로그로 저장
- 🎨 **관리자 대시보드**: React 기반의 직관적인 UI

---

## ✨ 주요 기능

### 1. 웹훅 수신 및 처리
```
잔디 메시지 → AI 요약 → (선택) Notion 저장 → 로그 기록
```

### 2. 어드민 대시보드
- **실시간 모니터링**: 처리 중인 웹훅 현황 (5초마다 자동 새로고침)
- **이력 조회**: 최근 완료된 웹훅 목록 (최대 10개)
- **단계별 시각화**: 각 처리 단계의 상태와 타임스탬프 표시
- **AI 요약 재생성**: 클릭 한 번으로 요약 재실행

### 3. 테스트 도구
- AI 요약 테스트
- 잔디 메시지 전송
- 웹훅 시뮬레이션

---

## 🏗 아키텍처

```
┌─────────────┐
│ 잔디 메신저 │
└──────┬──────┘
       │ Outgoing Webhook
       ↓
┌─────────────────────────────┐
│   Express 서버              │
│                             │
│  POST /webhook/jandi        │
│    ↓                        │
│  1. 웹훅 수신 (상태 추적)   │
│    ↓                        │
│  2. AI 요약 (OpenAI API)    │
│    ↓                        │
│  3. Notion 저장 (선택)      │
│    ↓                        │
│  4. 로그 기록               │
└─────────────────────────────┘
       ↓
┌─────────────────────────────┐
│   React 어드민 대시보드     │
│                             │
│  - 실시간 모니터링          │
│  - 단계별 시각화            │
│  - AI 요약 재생성           │
└─────────────────────────────┘
```

### 기술 스택
- **Backend**: Node.js 18+, Express.js
- **Frontend**: React 18, TypeScript, Create React App
- **AI**: OpenAI GPT-3.5-turbo
- **Storage**: JSON 파일 기반 로깅 (추후 DB 마이그레이션 예정)
- **External APIs**: Notion API, Jandi Webhook

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn
- OpenAI API 키 (AI 요약용, 선택)
- Notion API 키 및 Database ID (Notion 연동용, 선택)

### 설치 및 실행
```bash
# 1. 저장소 클론
git clone https://github.com/your-repo/jandi-notion-webhook.git
cd jandi-notion-webhook

# 2. 백엔드 의존성 설치
npm install

# 3. 프론트엔드 의존성 설치 및 빌드
cd frontend
npm install
npm run build
cd ..

# 4. 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 API 키 입력

# 5. 서버 실행
node server.js

# 6. (선택) 외부 접속을 위한 ngrok 실행
ngrok http 3000
```

### 접속 URL
- **메인 페이지**: http://localhost:3000/
- **어드민 대시보드**: http://localhost:3000/admin
- **웹훅 엔드포인트**: http://localhost:3000/webhook/jandi

---

## ⚙️ 환경 설정

### 1. 환경변수 (.env)
```env
# 서버 설정
PORT=3000

# Notion API (선택)
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI API (AI 요약용, 선택)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 잔디 Webhook (선택)
JANDI_WEBHOOK_TOKEN=your_secret_token_here
JANDI_OUTGOING_WEBHOOK_URL=https://wh.jandi.com/connect-api/webhook/xxxxx/xxxxxxxxx
```

### 2. Notion 설정

#### 2-1. API 키 발급
1. [Notion Integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름 입력 후 생성
4. "Internal Integration Token" 복사 → `.env`의 `NOTION_API_KEY`에 입력

#### 2-2. 데이터베이스 생성
노션에서 새 데이터베이스 생성 후 다음 속성 추가:
- **제목** (Title) - 기본 속성
- **내용** (Text)
- **작성자** (Text)
- **대화방** (Select)
- **팀** (Select)
- **작성일** (Date)

#### 2-3. Integration 연결
1. 노션 데이터베이스 페이지에서 우측 상단 "..." 클릭
2. "Add connections" → 생성한 Integration 선택

### 3. 잔디 Webhook 설정
1. 잔디 관리자 설정 접속
2. 원하는 대화방에서 "Outgoing Webhook" 생성
3. **URL**: `https://your-ngrok-url.ngrok.io/webhook/jandi`
4. **트리거 단어**: (선택) `/서버` 등의 키워드 설정

---

## 📚 API 문서

### 웹훅 수신
```http
POST /webhook/jandi
Content-Type: application/json

{
  "token": "webhook_token",
  "teamName": "회사명",
  "roomName": "대화방명",
  "writerName": "작성자",
  "text": "메시지 내용",
  "createdAt": "2025-10-10T00:00:00Z"
}
```

### 어드민 API

#### 웹훅 목록 조회
```http
GET /admin/webhooks

Response:
{
  "processing": [ /* 처리 중인 웹훅 */ ],
  "recent": [ /* 최근 완료된 웹훅 (최대 10개) */ ]
}
```

#### AI 요약 재생성
```http
POST /admin/retry-ai-summary
Content-Type: application/json

{
  "webhookId": "webhook_1760055724519_u0pi4o22d"
}
```

#### 테스트 엔드포인트
```http
POST /test-ai-summary
Content-Type: application/json

{
  "text": "요약할 텍스트"
}
```

**전체 API 명세**: [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md#5-api-명세)

---

## 🎨 싱글톤 프롬프트 개발

이 프로젝트는 **싱글톤(Single-turn) 방식**으로 개발되었습니다.

### 핵심 원칙
```
🎯 프롬프트 한 번으로 전체 시스템 생성
🔄 수정 시 → 롤백 → 프롬프트 수정 → 재생성
📐 멱등성: 같은 프롬프트 = 같은 결과
```

### 프롬프트 파일
- **[SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md)**: 전체 시스템 명세
- **[ADMIN_PROMPT.md](./ADMIN_PROMPT.md)**: 어드민 대시보드 명세
- **[docs/agent.md](./docs/agent.md)**: AI 에이전트 명세
- **[docs/claude.md](./docs/claude.md)**: Claude Code 사용 가이드

### 개발 워크플로우
```bash
# 1. 문제 발견 또는 기능 추가 필요
# 2. 프롬프트 파일 수정
vim SYSTEM_PROMPT.md

# 3. 코드 롤백
git reset --hard HEAD

# 4. AI에게 프롬프트 전달
# "SYSTEM_PROMPT.md를 읽고 server.js를 재생성해주세요"

# 5. 테스트
npm test

# 6. 커밋 (프롬프트 + 코드 함께)
git add SYSTEM_PROMPT.md server.js
git commit -m "feat: Add new feature based on updated prompt"
```

**자세한 가이드**: [docs/claude.md](./docs/claude.md)

---

## 📁 프로젝트 구조

```
jandi-notion-webhook/
├── server.js                   # Express 서버 (메인)
├── package.json                # 백엔드 의존성
├── .env                        # 환경변수 (Git 제외)
├── webhook_logs.json           # 웹훅 로그 (자동 생성)
│
├── SYSTEM_PROMPT.md            # 🔑 전체 시스템 싱글톤 프롬프트
├── ADMIN_PROMPT.md             # 🔑 어드민 대시보드 싱글톤 프롬프트
├── README.md                   # 이 파일
│
├── docs/                       # 📚 문서
│   ├── agent.md                # AI 에이전트 명세
│   ├── claude.md               # Claude Code 사용 가이드
│   └── api.md                  # API 상세 명세 (추후 추가)
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MainPage.tsx    # 메인 페이지
│   │   │   └── AdminPage.tsx   # 어드민 대시보드
│   │   ├── components/         # 재사용 컴포넌트
│   │   ├── services/           # API 클라이언트
│   │   ├── types/              # TypeScript 타입
│   │   └── App.tsx
│   ├── build/                  # 빌드 결과물 (Git 제외)
│   └── package.json            # 프론트엔드 의존성
│
└── .prompts/                   # 🗂 프롬프트 버전 백업
    ├── v1.0.0.md
    └── v1.1.0.md
```

---

## 🧪 테스트

### 수동 테스트

#### 1. 서버 상태 확인
```bash
curl http://localhost:3000
```

#### 2. 웹훅 테스트
```bash
curl -X POST http://localhost:3000/test
```

#### 3. AI 요약 테스트
```bash
curl -X POST http://localhost:3000/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"오늘 회의에서 프로젝트 일정을 논의했습니다."}'
```

#### 4. 잔디 웹훅 시뮬레이션
```bash
curl -X POST http://localhost:3000/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "테스트팀",
    "roomName": "테스트룸",
    "writerName": "홍길동",
    "text": "테스트 메시지입니다.",
    "createdAt": "2025-10-10T00:00:00Z"
  }'
```

### 자동화 테스트 (추후 구현)
```bash
npm test
```

---

## 🚢 배포

### 로컬 개발
```bash
npm start
```

### 프로덕션 배포 (추후)
- Docker 컨테이너화
- CI/CD 파이프라인 (GitHub Actions)
- 환경별 설정 분리 (dev/staging/prod)

---

## 🔧 문제 해결

### 1. AI 요약이 생성되지 않음
```
증상: aiSummary가 null
원인: OpenAI API 키 미설정
해결: .env 파일의 OPENAI_API_KEY 확인
```

### 2. Notion 저장 안 됨
```
증상: Notion에 페이지가 생성되지 않음
원인: 현재 Notion 연동이 비활성화됨
해결: server.js 357-413행 주석 해제
```

### 3. 프론트엔드 표시 안 됨
```
증상: 404 에러
원인: frontend/build 폴더 없음
해결: cd frontend && npm run build
```

### 4. 포트 충돌
```
증상: EADDRINUSE 에러
해결: .env에서 PORT 변경 또는 기존 프로세스 종료
```

### 5. ngrok 접속 안 됨
```
증상: 잔디 웹훅이 수신되지 않음
해결:
- ngrok이 실행 중인지 확인
- 잔디 Outgoing Webhook URL 확인
- 서버 로그 확인
```

**전체 트러블슈팅**: [docs/claude.md#14-트러블슈팅](./docs/claude.md#14-트러블슈팅)

---

## 🤝 기여하기

### 기여 절차
1. 이슈 생성 또는 기존 이슈 확인
2. 프롬프트 파일(`.md`) 수정
3. 프롬프트 기반으로 코드 재생성
4. 테스트 통과 확인
5. Pull Request 제출

### PR 체크리스트
- [ ] 프롬프트 파일이 함께 수정되었는가?
- [ ] 프롬프트와 코드가 일치하는가?
- [ ] 테스트가 통과하는가?
- [ ] 환경변수가 문서화되었는가?
- [ ] 에러 처리가 명세대로 구현되었는가?

**자세한 가이드**: [docs/claude.md#7-협업-시-규칙](./docs/claude.md#7-협업-시-규칙)

---

## 📖 관련 문서

### 핵심 문서
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) - 전체 시스템 싱글톤 프롬프트
- [ADMIN_PROMPT.md](./ADMIN_PROMPT.md) - 어드민 대시보드 싱글톤 프롬프트

### 기술 문서
- [docs/agent.md](./docs/agent.md) - AI 에이전트 명세
- [docs/claude.md](./docs/claude.md) - Claude Code 사용 가이드

### 외부 참고
- [Notion API Documentation](https://developers.notion.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Jandi Webhook Documentation](https://www.jandi.com/landing/kr/integration/custom)

---

## 📊 성능 지표

### 현재 성능
- **웹훅 응답 시간**: 평균 2-4초
- **AI 요약 시간**: 평균 2-3초
- **동시 처리**: 최대 100 req/s (테스트 필요)
- **메모리 사용**: ~100MB (평균)

### 비용 (AI 요약)
- **건당 비용**: ~$0.00055 (약 0.7원)
- **월 1만 건**: ~$5.50 (약 7,000원)

---

## 🔐 보안

### 권장사항
1. ✅ `.env` 파일을 Git에 커밋하지 않음
2. ✅ `.gitignore`에 `.env`, `webhook_logs.json` 추가
3. ✅ HTTPS 사용 (ngrok 또는 실제 도메인)
4. ⚠️ 프로덕션에서 잔디 토큰 검증 활성화
5. ⚠️ Rate Limiting 구현 (추후)

---

## 📝 라이센스

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 👥 제작

**개발팀**
- 프로젝트 설계: 참석자 1 (리더/매니저)
- 개발: 참석자 2 (개발자 다빈)
- AI 어시스턴트: Claude Code

---

## 📞 문의

- **이슈**: [GitHub Issues](https://github.com/your-repo/jandi-notion-webhook/issues)
- **이메일**: your-email@example.com

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

Made with ❤️ using Claude Code & Singleton Prompts

</div>
