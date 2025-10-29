# 잔디-노션 웹훅 통합 시스템

<div align="center">

**잔디(Jandi) 메신저의 메시지를 AI로 요약하여 Notion에 자동 저장하는 통합 시스템**

[![Vercel](https://img.shields.io/badge/Vercel-Serverless-black)](https://vercel.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-blue)](https://openai.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

</div>

---

## 📋 목차

- [개요](#-개요)
- [주요 기능](#-주요-기능)
- [시스템 아키텍처](#-시스템-아키텍처)
- [빠른 시작](#-빠른-시작)
- [배포 가이드](#-배포-가이드)
- [환경 설정](#-환경-설정)
- [API 문서](#-api-문서)
- [프로젝트 구조](#-프로젝트-구조)
- [자동 배포](#-자동-배포)
- [문제 해결](#-문제-해결)

---

## 🎯 개요

잔디 메신저의 대화 내용을 **ChatGPT (GPT-3.5-turbo)**로 자동 요약하고, **Notion** 데이터베이스에 저장하는 서버리스 웹훅 시스템입니다.

### 핵심 가치
- 🤖 **AI 자동 요약**: ChatGPT를 사용한 한국어 메시지 요약
- 📊 **실시간 모니터링**: 웹훅 처리 과정을 단계별로 추적
- 🔄 **재시도 기능**: AI 요약 결과가 마음에 안 들면 재생성
- 💾 **영구 저장**: Supabase PostgreSQL로 데이터 영구 저장
- 🎨 **관리자 대시보드**: React 기반의 직관적인 UI
- 🚀 **자동 배포**: GitHub Push → Supabase 마이그레이션 → Vercel 자동 배포

---

## ✨ 주요 기능

### 1. 웹훅 수신 및 처리
```
잔디 메시지 → ChatGPT 요약 → Notion 저장 → Supabase 로그
```

### 2. 관리자 대시보드
- **실시간 모니터링**: 처리 중인 웹훅 현황
- **이력 조회**: 최근 완료된 웹훅 목록
- **단계별 시각화**: 각 처리 단계의 상태와 타임스탬프
- **AI 요약 재생성**: 클릭 한 번으로 요약 재실행

### 3. 자동 배포 시스템
- GitHub Push 시 자동 배포
- Supabase 데이터베이스 마이그레이션 자동 실행
- Vercel Serverless Functions 자동 배포

---

## 🏗 시스템 아키텍처

```
┌─────────────┐
│ 잔디 메신저 │
└──────┬──────┘
       │ Outgoing Webhook
       ↓
┌──────────────────────────────┐
│  Vercel Serverless Functions │
│  ├─ /api/webhook/jandi       │  ← 웹훅 수신
│  ├─ /api/admin/*             │  ← 관리자 API
│  └─ /api/logs                │  ← 로그 조회
└────────┬─────────────────────┘
         │
    ┌────┴─────┬──────────┬─────────┐
    ↓          ↓          ↓         ↓
┌─────────┐ ┌─────────┐ ┌────────┐ ┌──────────┐
│ ChatGPT │ │ Notion  │ │Supabase│ │  React   │
│   API   │ │   API   │ │(PG DB) │ │Dashboard │
└─────────┘ └─────────┘ └────────┘ └──────────┘
```

### 기술 스택
- **Backend**: Vercel Serverless Functions (Node.js 18)
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL 15)
- **Storage**: Supabase Storage
- **Deployment**: Vercel, GitHub Actions
- **APIs**: Notion API, Jandi Webhook

---

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn
- OpenAI API 키 (ChatGPT)
- Notion API 키 및 Database ID
- Supabase 프로젝트

### 로컬 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd jandi-notion-webhook

# 2. 백엔드 의존성 설치
npm install

# 3. 프론트엔드 의존성 설치
cd frontend
npm install
cd ..

# 4. 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 API 키 입력

# 5. Vercel Dev 서버 실행 (권장)
npx vercel dev

# 또는 로컬 서버 실행
npm start
```

### 접속 URL
- **메인 페이지**: http://localhost:3000/
- **관리자 대시보드**: http://localhost:3000/admin
- **웹훅 엔드포인트**: http://localhost:3000/api/webhook/jandi

---

## 🌐 배포 가이드

### Vercel 배포

#### 1단계: GitHub 연동
```bash
# GitHub 저장소에 코드 푸시
git add .
git commit -m "Initial commit"
git push origin main
```

#### 2단계: Vercel 프로젝트 생성
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "Add New Project" → GitHub 저장소 선택
3. Framework Preset: **Other** 선택
4. Root Directory: `.` (기본값)
5. "Deploy" 클릭

#### 3단계: 환경변수 설정
Vercel 프로젝트 → Settings → Environment Variables

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | OpenAI API 키 |
| `NOTION_API_KEY` | Notion Integration Token |
| `NOTION_DATABASE_ID` | Notion Database ID |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_ANON_KEY` | Supabase Anon Key |

#### 4단계: 재배포
```bash
vercel --prod
```

### Supabase 설정

자세한 Supabase 설정은 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 참고하세요.

---

## ⚙️ 환경 설정

### 환경변수 (.env)

```env
# OpenAI API
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Notion API
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 잔디 Webhook (선택)
JANDI_WEBHOOK_TOKEN=your_secret_token
JANDI_OUTGOING_WEBHOOK_URL=https://wh.jandi.com/connect-api/webhook/xxxxx
```

### Notion 데이터베이스 구조

| 속성 | 타입 | 설명 |
|------|------|------|
| 제목 | Title | 기본 제목 |
| 원본 내용 | Text | 잔디 원본 메시지 |
| AI 요약 | Text | ChatGPT 요약 결과 |
| 작성자 | Text | 메시지 작성자 |
| 대화방 | Select | 잔디 대화방 이름 |
| 팀 | Select | 잔디 팀 이름 |
| 작성일 | Date | 메시지 작성 시간 |

### 잔디 Webhook 설정

1. 잔디 관리자 → Outgoing Webhook 생성
2. **URL**: `https://your-app.vercel.app/api/webhook/jandi`
3. **트리거 단어**: (선택) 특정 키워드로 필터링

---

## 📚 API 문서

### 웹훅 수신

```http
POST /api/webhook/jandi
Content-Type: application/json

{
  "teamName": "팀명",
  "roomName": "대화방명",
  "userName": "작성자",
  "text": "메시지 내용",
  "createdAt": "2025-10-29T00:00:00Z"
}
```

### 관리자 API

#### 웹훅 목록 조회
```http
GET /api/admin/webhooks

Response:
{
  "processing": [...],  // 처리 중인 웹훅
  "recent": [...]       // 최근 완료된 웹훅
}
```

#### AI 요약 재생성
```http
POST /api/admin/retry-ai-summary
Content-Type: application/json

{
  "webhookId": "webhook_1730000000000_abc123"
}
```

#### 로그 조회
```http
GET /api/logs?limit=100
```

---

## 📁 프로젝트 구조

```
jandi-notion-webhook/
├── api/                        # Vercel Serverless Functions
│   ├── webhook/
│   │   └── jandi.js           # 웹훅 수신 API
│   ├── admin/
│   │   ├── webhooks.js        # 웹훅 목록 조회
│   │   └── retry-ai-summary.js # AI 요약 재생성
│   ├── logs.js                # 로그 조회
│   └── _utils/                # 공통 유틸리티
│       ├── openai.js          # OpenAI 클라이언트
│       ├── notion.js          # Notion API 클라이언트
│       ├── supabase.js        # Supabase 클라이언트
│       └── storage.js         # 저장소 관리
│
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MainPage.tsx   # 메인 페이지
│   │   │   └── AdminPage.tsx  # 관리자 대시보드
│   │   ├── components/        # 재사용 컴포넌트
│   │   ├── services/          # API 클라이언트
│   │   └── types/             # TypeScript 타입
│   └── public/                # 정적 파일
│
├── supabase/                  # Supabase 설정
│   ├── migrations/            # DB 마이그레이션
│   │   └── 20250127000000_initial_schema.sql
│   └── config.toml            # Supabase 설정
│
├── scripts/
│   └── deploy.js              # 자동 배포 스크립트
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions 워크플로우
│
├── vercel.json                # Vercel 설정
├── package.json               # 백엔드 의존성
├── .env                       # 환경변수 (Git 제외)
│
├── README.md                  # 이 파일
├── SUPABASE_SETUP.md          # Supabase 설정 가이드
├── SUPABASE_AUTO_DEPLOY.md    # 자동 배포 가이드
├── SYSTEM_PROMPT.md           # 시스템 명세 (AI용)
└── ADMIN_PROMPT.md            # 관리자 페이지 명세 (AI용)
```

---

## 🤖 자동 배포

### 배포 명령어

```bash
# 간단한 배포
npm run deploy "커밋 메시지"

# 예시
npm run deploy "feat: 새로운 기능 추가"
```

### 자동 배포 흐름

```
npm run deploy
    ↓
Git commit & push
    ↓
GitHub Actions 트리거
    ↓
├─ Supabase 마이그레이션 실행
└─ Vercel 자동 배포
    ↓
배포 완료!
```

### GitHub Actions 설정

자세한 자동 배포 설정은 [SUPABASE_AUTO_DEPLOY.md](./SUPABASE_AUTO_DEPLOY.md)를 참고하세요.

**필요한 GitHub Secrets:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## 🧪 테스트

### 웹훅 테스트

```bash
# Vercel Dev 환경
curl -X POST http://localhost:3000/api/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "테스트팀",
    "roomName": "테스트룸",
    "userName": "홍길동",
    "text": "오늘 회의에서 프로젝트 일정을 논의했습니다.",
    "createdAt": "2025-10-29T00:00:00Z"
  }'
```

### AI 요약 테스트

```bash
curl -X POST http://localhost:3000/api/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트 메시지입니다."}'
```

---

## 🔧 문제 해결

### Q1: "Supabase 환경변수가 설정되지 않았습니다"
**해결**: `.env` 파일에 `SUPABASE_URL`과 `SUPABASE_ANON_KEY` 추가

### Q2: "AI 요약이 생성되지 않음"
**해결**: `OPENAI_API_KEY` 확인 및 API 크레딧 잔액 확인

### Q3: "Notion 페이지가 생성되지 않음"
**해결**:
1. Notion Integration이 데이터베이스에 연결되었는지 확인
2. `NOTION_API_KEY`와 `NOTION_DATABASE_ID` 확인

### Q4: "프론트엔드가 표시되지 않음"
**해결**:
```bash
cd frontend
npm run build
```

### Q5: "Vercel 배포 실패"
**해결**:
1. Vercel 환경변수 확인
2. `vercel.json` 설정 확인
3. Vercel 로그 확인

---

## 📊 성능 지표

- **웹훅 응답 시간**: 평균 2-4초
- **AI 요약 시간**: 평균 2-3초
- **동시 처리**: Serverless - 자동 스케일링
- **비용**: Vercel Free tier + Supabase Free tier

### AI 비용 (GPT-3.5-turbo)
- **건당 비용**: ~$0.0005 (약 0.6원)
- **월 1만 건**: ~$5 (약 6,500원)

---

## 🔐 보안

### 권장사항
- ✅ `.env` 파일을 Git에 커밋하지 않음
- ✅ Vercel 환경변수로 민감한 정보 관리
- ✅ Supabase Row Level Security (RLS) 활성화
- ✅ HTTPS 사용 (Vercel 기본 제공)
- ⚠️ API Rate Limiting 구현 권장

---

## 📖 관련 문서

### 프로젝트 문서
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase 설정 가이드
- [SUPABASE_AUTO_DEPLOY.md](./SUPABASE_AUTO_DEPLOY.md) - 자동 배포 가이드
- [SYSTEM_PROMPT.md](./SYSTEM_PROMPT.md) - 시스템 명세 (AI용)
- [ADMIN_PROMPT.md](./ADMIN_PROMPT.md) - 관리자 페이지 명세 (AI용)

### 외부 문서
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Notion API Documentation](https://developers.notion.com/)
- [Jandi Webhook Documentation](https://www.jandi.com/landing/kr/integration/custom)

---

## 📝 라이센스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 👥 제작

**개발**: AI 기반 자동화 시스템
**프레임워크**: Vercel Serverless + Supabase + OpenAI

---

<div align="center">

Made with ❤️ using Vercel, Supabase & OpenAI

</div>
