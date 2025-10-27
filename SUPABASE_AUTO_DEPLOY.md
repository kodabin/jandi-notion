# Supabase 자동 배포 가이드

## 개요

이 프로젝트는 **GitHub Actions**를 통해 Supabase 데이터베이스 스키마를 자동으로 배포합니다.

**master/main 브랜치에 push**할 때마다:
1. 프론트엔드 빌드
2. **Supabase 데이터베이스 마이그레이션 자동 실행** ✨
3. Vercel에 자동 배포

---

## 설정 방법

### 1단계: Supabase Access Token 발급

#### 1-1. Supabase 대시보드 접속
https://app.supabase.com 로그인

#### 1-2. Access Token 생성
1. 우측 상단 프로필 아이콘 클릭
2. **"Account Settings"** 선택
3. 좌측 메뉴에서 **"Access Tokens"** 클릭
4. **"Generate New Token"** 클릭
5. Token 이름 입력: `GitHub Actions Deploy`
6. **"Generate Token"** 클릭
7. 생성된 토큰을 복사 (⚠️ 다시 볼 수 없으니 안전한 곳에 저장!)

```
예시: sbp_1234567890abcdefghijklmnopqrstuvwxyz...
```

---

### 2단계: Supabase 프로젝트 정보 확인

#### 2-1. 프로젝트 ID 확인
1. Supabase 대시보드에서 프로젝트 선택
2. **Settings** → **General** 클릭
3. **Reference ID** 복사

```
예시: abcdefghijklmnop
```

#### 2-2. 데이터베이스 비밀번호 확인
프로젝트 생성 시 설정했던 데이터베이스 비밀번호를 준비하세요.

만약 비밀번호를 잊어버렸다면:
1. **Settings** → **Database** 클릭
2. **"Reset Database Password"** 클릭
3. 새 비밀번호 설정

---

### 3단계: GitHub Secrets 설정

#### 3-1. GitHub 저장소 접속
https://github.com/[YOUR_USERNAME]/jandi-notion-webhook

#### 3-2. Secrets 추가
1. **Settings** → **Secrets and variables** → **Actions** 클릭
2. **"New repository secret"** 클릭
3. 다음 3개의 secret 추가:

| Name | Value | 설명 |
|------|-------|------|
| `SUPABASE_ACCESS_TOKEN` | `sbp_1234...` | 1단계에서 발급받은 Access Token |
| `SUPABASE_PROJECT_ID` | `abcdefghijklmnop` | 2단계에서 확인한 Project Reference ID |
| `SUPABASE_DB_PASSWORD` | `MySecureP@ssw0rd` | 2단계에서 확인한 DB 비밀번호 |

---

### 4단계: 자동 배포 테스트

#### 4-1. 코드 변경 및 Push
```bash
# 간단한 변경사항 추가
echo "# Test Auto Deploy" >> README.md

# Git 커밋 및 푸시
git add .
git commit -m "test: Supabase 자동 배포 테스트"
git push origin master
```

#### 4-2. GitHub Actions 확인
1. GitHub 저장소 → **Actions** 탭
2. 최근 워크플로우 실행 확인
3. "Run Supabase migrations" 단계가 성공하는지 확인

```
✅ Run Supabase migrations
   Linked to project ref: abcdefghijklmnop
   Applying migration: 20250127000000_initial_schema.sql
   Migration applied successfully!
```

#### 4-3. Supabase 데이터베이스 확인
1. Supabase 대시보드 → **Table Editor**
2. `webhooks`, `logs`, `webhook_steps` 테이블이 생성되었는지 확인

---

## 마이그레이션 파일 추가 방법

### 새로운 마이그레이션 생성

데이터베이스 스키마를 변경하려면:

#### 1. 새 마이그레이션 파일 생성
```bash
# 타임스탬프 형식으로 파일명 생성
# 형식: YYYYMMDDHHMMSS_설명.sql
```

예시:
```bash
supabase/migrations/20250127120000_add_user_table.sql
```

#### 2. SQL 작성
```sql
-- 사용자 테이블 추가
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### 3. Git에 커밋 및 푸시
```bash
git add supabase/migrations/20250127120000_add_user_table.sql
git commit -m "feat: Add users table migration"
git push origin master
```

#### 4. 자동 배포 확인
GitHub Actions가 자동으로:
1. 새 마이그레이션 파일 감지
2. Supabase 데이터베이스에 적용
3. Vercel에 배포

---

## 마이그레이션 실행 순서

마이그레이션은 **파일명 순서대로** 실행됩니다:

```
supabase/migrations/
├── 20250127000000_initial_schema.sql      ← 1번 실행
├── 20250127120000_add_user_table.sql      ← 2번 실행
└── 20250128100000_add_permissions.sql     ← 3번 실행
```

⚠️ **중요**:
- 타임스탬프 형식을 꼭 지켜주세요 (YYYYMMDDHHmmss)
- 한 번 실행된 마이그레이션은 수정하지 마세요
- 새로운 변경사항은 항상 새 파일로 생성하세요

---

## 로컬에서 마이그레이션 테스트

배포 전에 로컬에서 먼저 테스트하려면:

### 1. Supabase CLI 설치
```bash
npm install -g supabase
```

### 2. Supabase 프로젝트 연결
```bash
# 프로젝트 루트에서 실행
supabase link --project-ref YOUR_PROJECT_ID
```

### 3. 마이그레이션 실행
```bash
# 마이그레이션 적용
supabase db push

# 또는 특정 마이그레이션만 실행
supabase migration up
```

### 4. 마이그레이션 상태 확인
```bash
# 적용된 마이그레이션 목록 확인
supabase migration list
```

---

## 문제 해결

### Q1: "Authentication failed" 에러
**원인**: Access Token이 잘못되었거나 만료됨

**해결**:
1. Supabase에서 새 Access Token 발급
2. GitHub Secrets의 `SUPABASE_ACCESS_TOKEN` 업데이트

### Q2: "Project not found" 에러
**원인**: Project ID가 잘못됨

**해결**:
1. Supabase 대시보드에서 Reference ID 다시 확인
2. GitHub Secrets의 `SUPABASE_PROJECT_ID` 업데이트

### Q3: "Password authentication failed" 에러
**원인**: 데이터베이스 비밀번호가 잘못됨

**해결**:
1. Supabase 대시보드에서 비밀번호 재설정
2. GitHub Secrets의 `SUPABASE_DB_PASSWORD` 업데이트

### Q4: 마이그레이션이 실행되지 않음
**원인**: PR 배포 시에는 마이그레이션이 실행되지 않음

**해결**:
- 마이그레이션은 **master/main 브랜치에 push될 때만** 실행됩니다
- PR을 머지한 후 확인하세요

### Q5: "Migration already applied" 경고
**정상**: 이미 적용된 마이그레이션은 스킵됩니다

---

## 워크플로우 구조

### GitHub Actions 흐름

```
┌─────────────────────────────────────┐
│  코드 Push (master/main)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  1. 코드 체크아웃                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Node.js 및 의존성 설치          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. 프론트엔드 빌드                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Supabase CLI 설치               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  5. Supabase 프로젝트 연결          │
│     (supabase link)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  6. 데이터베이스 마이그레이션 실행   │
│     (supabase db push)              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  7. Vercel 배포                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  ✅ 배포 완료!                      │
└─────────────────────────────────────┘
```

---

## 마이그레이션 Best Practices

### ✅ 권장사항
1. **멱등성(Idempotency)**: `CREATE TABLE IF NOT EXISTS` 사용
2. **순차 실행**: 타임스탬프로 파일명 정렬
3. **작은 단위**: 하나의 마이그레이션에 하나의 변경사항
4. **롤백 계획**: 필요시 롤백 마이그레이션 준비
5. **테스트**: 로컬에서 먼저 테스트 후 배포

### ❌ 피해야 할 것
1. 기존 마이그레이션 수정
2. 프로덕션 데이터 삭제 (DROP TABLE 주의)
3. 타임스탬프 없는 파일명
4. 너무 큰 마이그레이션 (여러 테이블 동시 변경)

---

## 환경별 배포 전략

### Production (master/main 브랜치)
- ✅ Supabase 마이그레이션 실행
- ✅ Vercel Production 배포

### Preview (Pull Request)
- ❌ Supabase 마이그레이션 실행 안 함 (Production DB 보호)
- ✅ Vercel Preview 배포만 실행

---

## 참고 자료

- [Supabase CLI 문서](https://supabase.com/docs/guides/cli)
- [Supabase 마이그레이션 가이드](https://supabase.com/docs/guides/cli/managing-migrations)
- [GitHub Actions 문서](https://docs.github.com/en/actions)

---

**설정 완료!** 이제 코드를 푸시할 때마다 Supabase 데이터베이스가 자동으로 업데이트됩니다! 🚀
