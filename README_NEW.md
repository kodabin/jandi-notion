# 잔디-노션 웹훅 통합 시스템

<div align="center">

**잔디(Jandi) 메신저의 메시지를 AI로 요약하여 Notion에 자동 저장하는 통합 시스템**

[![Vercel](https://img.shields.io/badge/Vercel-Serverless-black)](https://vercel.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Claude AI](https://img.shields.io/badge/Claude-3.5%20Sonnet-blue)](https://anthropic.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)

</div>

---

## 🎯 주요 기능

- 🤖 **AI 자동 요약**: Claude 3.5 Sonnet을 사용한 한국어 메시지 요약
- 📊 **실시간 모니터링**: 웹훅 처리 과정을 단계별로 추적
- 🔄 **재시도 기능**: AI 요약 결과가 마음에 안 들면 재생성
- 💾 **영구 저장**: Supabase PostgreSQL로 데이터 영구 저장
- 🎨 **관리자 대시보드**: React 기반의 직관적인 UI
- 🚀 **자동 배포**: GitHub Push → Vercel 자동 배포

---

## 🏗 시스템 아키텍처

```
┌─────────────┐
│ 잔디 메신저 │
└──────┬──────┘
       │ Webhook
       ↓
┌──────────────────────────────┐
│  Vercel Serverless Functions │
│  ├─ /api/webhook/jandi       │
│  ├─ /api/admin/*             │
│  └─ /api/logs                │
└────────┬─────────────────────┘
         ↓
    ┌────────┐      ┌──────────┐
    │Claude  │      │ Supabase │
    │   AI   │      │  (PG DB) │
    └────────┘      └──────────┘
         ↓               ↓
┌──────────────────────────────┐
│ React Admin Dashboard        │
│  https://your-app.vercel.app │
└──────────────────────────────┘
```

---

## 🚀 빠른 시작

### 1. 저장소 클론

```bash
git clone https://github.com/your-username/jandi-notion-webhook.git
cd jandi-notion-webhook
```

### 2. 의존성 설치

```bash
# 루트 의존성
npm install

# 프론트엔드 의존성
cd frontend
npm install
cd ..
```

### 3. 환경변수 설정

`.env` 파일 생성:

```env
# Claude AI (필수)
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (필수)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Notion (선택)
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...

# 잔디 (선택)
JANDI_OUTGOING_WEBHOOK_URL=https://wh.jandi.com/...
```

### 4. 로컬 개발 서버 실행

```bash
npm run dev
```

접속: http://localhost:3000

---

## 📦 배포

### 한 줄 명령어로 배포

```bash
npm run deploy "커밋 메시지"
```

**예시:**
```bash
npm run deploy "새 기능 추가"
```

이 명령어는 자동으로:
1. Git Add + Commit
2. GitHub Push
3. Vercel 자동 배포 트리거

자세한 내용: [AUTO_DEPLOY_GUIDE.md](AUTO_DEPLOY_GUIDE.md)

---

## 🗄️ Supabase 설정

### 1. Supabase 프로젝트 생성
https://supabase.com 에서 프로젝트 생성

### 2. 테이블 생성
SQL Editor에서 실행:

```sql
-- webhooks 테이블
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'received',
  team_name TEXT,
  room_name TEXT,
  user_name TEXT,
  text TEXT,
  ai_summary TEXT,
  notion_page_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- logs 테이블
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- webhook_steps 테이블
CREATE TABLE webhook_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL,
  step TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

자세한 내용: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

---

## 📚 문서

### 핵심 문서
- [AUTO_DEPLOY_GUIDE.md](AUTO_DEPLOY_GUIDE.md) - 자동 배포 가이드
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase 설정 가이드
- [VERCEL_DEPLOYMENT_COMPLETE.md](VERCEL_DEPLOYMENT_COMPLETE.md) - Vercel 배포 가이드

### 아키텍처 문서
- [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - 시스템 명세
- [ADMIN_PROMPT.md](ADMIN_PROMPT.md) - Admin 대시보드 명세

---

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js 18+
- **Functions**: Vercel Serverless Functions
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Database**: Supabase (PostgreSQL)
- **APIs**: Notion API, Jandi Webhook

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build**: Create React App
- **Routing**: React Router v7
- **HTTP**: Axios

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions (선택)
- **Version Control**: Git

---

## 📊 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/webhook/jandi` | 잔디 웹훅 수신 |
| GET | `/api/admin/webhooks` | 웹훅 상태 조회 |
| POST | `/api/admin/retry-ai-summary` | AI 요약 재생성 |
| GET | `/api/logs` | 로그 조회 |
| POST | `/api/test-ai-summary` | AI 요약 테스트 |
| POST | `/api/send-to-jandi` | 잔디로 메시지 전송 |

---

## 🎨 프로젝트 구조

```
jandi-notion-webhook/
├── api/                          # Vercel Serverless Functions
│   ├── _utils/                   # 공통 유틸리티
│   │   ├── anthropic.js          # Claude AI
│   │   ├── notion.js             # Notion API
│   │   ├── supabase.js           # Supabase 클라이언트
│   │   └── storage.js            # 데이터 저장소
│   ├── webhook/jandi.js          # 잔디 웹훅 수신
│   ├── admin/                    # 관리자 API
│   └── ...
│
├── frontend/                     # React 프론트엔드
│   ├── src/
│   │   ├── pages/               # 페이지 컴포넌트
│   │   ├── components/          # 재사용 컴포넌트
│   │   ├── services/            # API 클라이언트
│   │   └── ...
│   └── package.json
│
├── scripts/                      # 배포 스크립트
│   └── deploy.js
│
├── .github/workflows/            # GitHub Actions
│   └── deploy.yml
│
├── package.json                  # 루트 의존성
├── vercel.json                   # Vercel 설정
└── README.md
```

---

## 🔧 로컬 개발

### Vercel Dev 서버 (권장)

```bash
npm run dev
```

Vercel 환경을 로컬에서 시뮬레이션합니다.

### 기존 방식

```bash
# 백엔드 (참고용으로만 사용)
npm start

# 프론트엔드
cd frontend
npm start
```

---

## 🐛 문제 해결

### Q1: "Supabase 환경변수가 설정되지 않았습니다"
**A**: `.env` 파일에 `SUPABASE_URL`과 `SUPABASE_ANON_KEY`를 추가하세요.

### Q2: "AI 요약이 생성되지 않습니다"
**A**: `ANTHROPIC_API_KEY`를 확인하고 API 키가 유효한지 확인하세요.

### Q3: "배포 후 API가 404 에러"
**A**: Vercel 로그를 확인하고 `vercel.json` 설정을 확인하세요.

### Q4: "Git push 실패"
**A**:
```bash
git branch  # 현재 브랜치 확인
git push origin master  # 또는 main
```

---

## 📝 라이센스

MIT License

---

## 👥 제작

- **개발**: Claude Code + 사용자
- **AI**: Claude 3.5 Sonnet
- **아키텍처**: Vercel Serverless + Supabase

---

## 🔗 링크

- **배포 URL**: https://your-app.vercel.app
- **Admin**: https://your-app.vercel.app/admin
- **GitHub**: https://github.com/your-username/jandi-notion-webhook
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://app.supabase.com

---

<div align="center">

**⭐ 이 프로젝트가 도움이 되었다면 Star를 눌러주세요!**

Made with ❤️ using Claude Code

</div>
