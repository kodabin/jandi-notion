# Supabase 설정 가이드

## 🎯 개요

이 프로젝트는 **Supabase PostgreSQL 데이터베이스**를 사용하여 웹훅과 로그를 영구적으로 저장합니다.

**장점:**
- ✅ 데이터 영구 저장
- ✅ 무료 플랜 제공 (500MB DB, 50MB 파일)
- ✅ 자동 백업
- ✅ 실시간 쿼리
- ✅ PostgreSQL의 모든 기능 사용

---

## 📦 1단계: Supabase 계정 만들기

### 1. Supabase 웹사이트 접속
https://supabase.com 접속

### 2. 회원가입
1. **"Start your project"** 클릭
2. **"Sign in with GitHub"** 선택
3. GitHub 로그인 및 권한 승인

### 3. 새 프로젝트 생성
1. **"New project"** 클릭
2. **Organization** 선택 (없으면 새로 생성)
3. 다음 정보 입력:
   - **Name**: `jandi-notion-webhook`
   - **Database Password**: 강력한 비밀번호 생성
     - 💡 예: `MySecureP@ssw0rd2025!`
     - ⚠️ **이 비밀번호를 저장해두세요!** (나중에 복구 불가)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: **Free** 선택

4. **"Create new project"** 클릭

⏳ 프로젝트 생성에 약 2분 소요됩니다.

---

## 🗄️ 2단계: 데이터베이스 테이블 생성

### SQL 에디터 사용 (권장)

프로젝트가 생성되면:

1. 좌측 메뉴에서 **"SQL Editor"** 클릭
2. **"New query"** 클릭
3. 다음 SQL을 복사하여 붙여넣기:

```sql
-- 테이블 1: webhooks (웹훅 저장)
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_webhooks_webhook_id ON webhooks(webhook_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);
CREATE INDEX idx_webhooks_created_at ON webhooks(created_at DESC);

-- 테이블 2: logs (로그 저장)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_logs_webhook_id ON logs(webhook_id);
CREATE INDEX idx_logs_event_type ON logs(event_type);
CREATE INDEX idx_logs_created_at ON logs(created_at DESC);

-- 테이블 3: webhook_steps (웹훅 처리 단계)
CREATE TABLE webhook_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id TEXT NOT NULL,
  step TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_webhook_steps_webhook_id ON webhook_steps(webhook_id);
CREATE INDEX idx_webhook_steps_created_at ON webhook_steps(created_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_webhooks_updated_at
BEFORE UPDATE ON webhooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

4. **"Run"** 버튼 클릭 (또는 Ctrl+Enter)
5. ✅ "Success. No rows returned" 메시지 확인

---

## 🔑 3단계: API 키 가져오기

1. 좌측 메뉴 **"Settings"** (톱니바퀴 아이콘) 클릭
2. **"API"** 클릭
3. 다음 정보를 복사:

### Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### API Keys
```
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

📝 **이 정보를 메모장에 저장해두세요!**

---

## ⚙️ 4단계: 환경변수 설정

### 로컬 개발 (.env 파일)

프로젝트 루트 디렉토리의 `.env` 파일에 추가:

```env
# 기존 환경변수들...
ANTHROPIC_API_KEY=sk-ant-...
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...

# Supabase 설정 (새로 추가)
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Vercel 배포 환경

Vercel 대시보드에서:

1. 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 환경변수 추가:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://xxxxxxxxxxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

**중요**: Production, Preview, Development 모두 체크!

4. **재배포 필요!** (환경변수는 빌드 타임에 적용됨)

---

## 🧪 5단계: 테스트

### 로컬에서 테스트

```bash
# 서버 실행
npm start

# 또는 Vercel dev
vercel dev
```

### Supabase 데이터 확인

1. Supabase 대시보드 → **Table Editor**
2. 테이블 선택 (webhooks, logs, webhook_steps)
3. 데이터가 저장되는지 확인

### 테스트 웹훅 전송

```bash
curl -X POST http://localhost:3000/api/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "테스트팀",
    "roomName": "테스트룸",
    "userName": "홍길동",
    "text": "Supabase 테스트 메시지입니다.",
    "createdAt": "2025-10-27T00:00:00Z"
  }'
```

Supabase Table Editor에서 `webhooks` 테이블을 확인하면 데이터가 저장된 것을 볼 수 있습니다!

---

## 📊 데이터베이스 구조

### webhooks 테이블
웹훅의 전체 정보를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | Primary key |
| `webhook_id` | TEXT | 웹훅 고유 ID |
| `status` | TEXT | 현재 상태 (received, completed 등) |
| `team_name` | TEXT | 팀 이름 |
| `room_name` | TEXT | 대화방 이름 |
| `user_name` | TEXT | 작성자 이름 |
| `text` | TEXT | 원본 메시지 |
| `ai_summary` | TEXT | AI 요약 |
| `notion_page_id` | TEXT | Notion 페이지 ID |
| `created_at` | TIMESTAMPTZ | 생성 시간 |
| `updated_at` | TIMESTAMPTZ | 수정 시간 |

### logs 테이블
모든 이벤트 로그를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | Primary key |
| `webhook_id` | TEXT | 관련 웹훅 ID |
| `event_type` | TEXT | 이벤트 타입 (webhook_received 등) |
| `data` | JSONB | 이벤트 데이터 (JSON) |
| `created_at` | TIMESTAMPTZ | 생성 시간 |

### webhook_steps 테이블
웹훅 처리 단계를 저장합니다.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | Primary key |
| `webhook_id` | TEXT | 웹훅 ID |
| `step` | TEXT | 단계 이름 (received, ai_summary_start 등) |
| `data` | JSONB | 단계 데이터 (JSON) |
| `created_at` | TIMESTAMPTZ | 생성 시간 |

---

## 🔍 데이터 조회 예시

### Supabase SQL Editor에서 직접 쿼리:

```sql
-- 최근 웹훅 10개 조회
SELECT * FROM webhooks
ORDER BY created_at DESC
LIMIT 10;

-- 특정 대화방의 웹훅 조회
SELECT * FROM webhooks
WHERE room_name = '개발팀'
ORDER BY created_at DESC;

-- AI 요약이 생성된 웹훅만 조회
SELECT webhook_id, text, ai_summary, created_at
FROM webhooks
WHERE ai_summary IS NOT NULL
ORDER BY created_at DESC;

-- 최근 로그 100개 조회
SELECT * FROM logs
ORDER BY created_at DESC
LIMIT 100;

-- 특정 웹훅의 모든 처리 단계 조회
SELECT * FROM webhook_steps
WHERE webhook_id = 'webhook_1730000000000_abc123'
ORDER BY created_at ASC;
```

---

## 🔒 보안 설정 (선택)

### Row Level Security (RLS) 활성화

Supabase는 기본적으로 anon key로 모든 데이터에 접근 가능합니다.
프로덕션 환경에서는 RLS를 활성화하는 것을 권장합니다.

```sql
-- RLS 활성화
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_steps ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기/쓰기 가능 (기본 정책)
CREATE POLICY "Enable all access for all users" ON webhooks
FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON logs
FOR ALL USING (true);

CREATE POLICY "Enable all access for all users" ON webhook_steps
FOR ALL USING (true);
```

---

## 💾 백업 및 유지보수

### 자동 백업
Supabase는 매일 자동으로 백업합니다 (Free 플랜: 7일 보관)

### 수동 백업
1. Supabase 대시보드 → Database → Backups
2. **"Start a backup"** 클릭

### 데이터 내보내기 (Export)
```bash
# Supabase CLI 설치
npm install -g supabase

# 로그인
supabase login

# 프로젝트 링크
supabase link --project-ref xxxxxxxxxxxxx

# DB 덤프
supabase db dump -f backup.sql
```

---

## 🔧 문제 해결

### Q1: "테이블이 생성되지 않아요"
**A**: SQL Editor에서 SQL을 다시 실행하고 에러 메시지를 확인하세요.

### Q2: "데이터가 저장되지 않아요"
**A**:
1. 환경변수 (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) 확인
2. Vercel 로그에서 에러 확인
3. Supabase 대시보드 → Logs에서 에러 확인

### Q3: "RLS 정책 오류"
**A**:
```sql
-- 모든 정책 제거
DROP POLICY IF EXISTS "Enable all access for all users" ON webhooks;
DROP POLICY IF EXISTS "Enable all access for all users" ON logs;
DROP POLICY IF EXISTS "Enable all access for all users" ON webhook_steps;

-- RLS 비활성화
ALTER TABLE webhooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_steps DISABLE ROW LEVEL SECURITY;
```

### Q4: "메모리 저장소로 폴백됩니다"
**A**:
- Supabase 환경변수가 설정되지 않았거나 잘못되었습니다
- 콘솔 로그에 "⚠️ Supabase 환경변수가 설정되지 않았습니다" 메시지 확인

---

## 📈 모니터링

### Supabase 대시보드 활용

1. **Database** → **Statistics**: DB 사용량 확인
2. **Database** → **Backups**: 백업 상태 확인
3. **Logs**: 쿼리 로그 및 에러 확인
4. **API**: API 사용량 통계

---

## 💰 비용 (무료 플랜)

### Free Tier 제한
- **데이터베이스**: 500MB
- **스토리지**: 1GB
- **대역폭**: 2GB/월
- **API 요청**: 무제한

### 업그레이드가 필요한 경우
- Pro 플랜: $25/월
  - 8GB DB
  - 100GB 스토리지
  - 50GB 대역폭
  - 일일 백업

---

## ✅ 설정 완료 체크리스트

- [ ] Supabase 계정 생성
- [ ] 프로젝트 생성
- [ ] SQL로 테이블 생성 (webhooks, logs, webhook_steps)
- [ ] API URL 및 anon key 복사
- [ ] 로컬 `.env` 파일에 환경변수 추가
- [ ] Vercel 환경변수 설정
- [ ] Vercel 재배포
- [ ] 테스트 웹훅 전송
- [ ] Supabase Table Editor에서 데이터 확인

---

## 📚 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)

---

**설정 완료!** 이제 모든 데이터가 Supabase에 영구적으로 저장됩니다! 🎉
