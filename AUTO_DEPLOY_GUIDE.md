# 자동 배포 가이드

## 🎯 개요

이 프로젝트는 **자동 배포 파이프라인**이 구축되어 있습니다!

**한 번의 명령어로:**
- ✅ Git에 커밋
- ✅ GitHub에 푸시
- ✅ Vercel 자동 배포
- ✅ Supabase 데이터베이스 연동

---

## 🚀 빠른 시작 (3가지 방법)

### 방법 1: npm 스크립트 (권장)

```bash
npm run deploy "커밋 메시지"
```

**예시:**
```bash
npm run deploy "Supabase 통합 완료"
```

대화형으로 진행되며, 변경사항을 확인 후 배포할 수 있습니다!

---

### 방법 2: PowerShell (Windows)

```powershell
.\deploy.ps1 "커밋 메시지"
```

**예시:**
```powershell
.\deploy.ps1 "메인 페이지 UI 개선"
```

---

### 방법 3: Batch 파일 (Windows)

```cmd
deploy.bat "커밋 메시지"
```

**예시:**
```cmd
deploy.bat "버그 수정"
```

---

## 📋 자동 배포 프로세스

### 1단계: 로컬 변경
파일을 수정하고 저장합니다.

### 2단계: 배포 명령 실행
```bash
npm run deploy "변경 내용"
```

### 3단계: 자동 처리
스크립트가 다음을 자동으로 실행합니다:

1. **Git Add**: 모든 변경사항 추가
2. **Git Commit**: 커밋 메시지와 함께 커밋
3. **Git Push**: GitHub에 푸시
4. **Vercel 배포**: GitHub Actions 또는 Vercel이 자동 배포
5. **완료**: 2-3분 후 배포 완료!

---

## 🔧 초기 설정 (한 번만)

### 1. GitHub Actions 설정 (선택사항)

이미 `.github/workflows/deploy.yml` 파일이 생성되어 있습니다.

**추가 설정 필요:**

1. **Vercel Token 발급**
   - https://vercel.com/account/tokens 접속
   - "Create" 클릭
   - Token 이름 입력 (예: `github-actions`)
   - Scope: Full Account
   - "Create Token" 클릭
   - Token 복사 (한 번만 보입니다!)

2. **Vercel Project ID 확인**
   - Vercel 대시보드 → 프로젝트 선택
   - Settings → General
   - "Project ID" 복사

3. **Vercel Org ID 확인**
   - Vercel 대시보드
   - Settings → General
   - "Team ID" 또는 "Personal Account ID" 복사

4. **GitHub Secrets 추가**
   - GitHub 저장소 → Settings → Secrets and variables → Actions
   - "New repository secret" 클릭
   - 다음 3개 추가:

   | Name | Value |
   |------|-------|
   | `VERCEL_TOKEN` | (복사한 Token) |
   | `VERCEL_ORG_ID` | (복사한 Org ID) |
   | `VERCEL_PROJECT_ID` | (복사한 Project ID) |

### 2. Vercel GitHub 연동 (권장)

GitHub Actions 없이도 Vercel이 자동으로 배포할 수 있습니다:

1. Vercel 대시보드 → 프로젝트 선택
2. Settings → Git
3. GitHub 저장소 연결
4. **Production Branch**: `main` 또는 `master` 선택

이제 GitHub에 푸시만 하면 **자동으로 배포됩니다!**

---

## 💡 사용 예시

### 일반적인 워크플로우

```bash
# 1. 코드 수정
# 파일 편집...

# 2. 배포
npm run deploy "새 기능 추가"

# 3. 완료!
# ✅ GitHub Push 완료!
# 🔄 Vercel이 자동으로 배포를 시작합니다...
```

### 여러 파일 수정 후 배포

```bash
# 여러 파일 수정...
npm run deploy "프론트엔드 UI 개선 및 API 최적화"
```

### 버그 수정

```bash
npm run deploy "AI 요약 버그 수정"
```

---

## 🔍 배포 상태 확인

### Vercel 대시보드
https://vercel.com/dashboard

- **Deployments** 탭에서 실시간 배포 상태 확인
- **Logs** 탭에서 배포 로그 확인

### GitHub Actions (설정한 경우)
GitHub 저장소 → **Actions** 탭

- 각 배포의 상태 확인
- 로그 확인

---

## 📊 배포 프로세스 다이어그램

```
로컬 코드 수정
    ↓
npm run deploy "메시지"
    ↓
┌─────────────────┐
│   Git Commit    │
└────────┬────────┘
         ↓
┌─────────────────┐
│   Git Push      │
│   → GitHub      │
└────────┬────────┘
         ↓
┌─────────────────────────┐
│  GitHub (main/master)   │
└────────┬────────────────┘
         ↓
    (자동 트리거)
         ↓
┌─────────────────────────┐
│  Vercel 자동 배포       │
│  - 의존성 설치          │
│  - 프론트엔드 빌드      │
│  - Serverless 함수 배포 │
└────────┬────────────────┘
         ↓
┌─────────────────────────┐
│  배포 완료!             │
│  https://your-app       │
│    .vercel.app          │
└─────────────────────────┘
```

---

## 🛠 문제 해결

### Q1: "git push 실패"
**증상:**
```
error: failed to push some refs to 'https://github.com/...'
```

**해결:**
```bash
# 1. 현재 브랜치 확인
git branch

# 2. 브랜치가 master인 경우
git push origin master

# 3. 브랜치가 main인 경우
git push origin main

# 4. 브랜치 이름 변경 (master → main)
git branch -M main
git push -u origin main
```

### Q2: "커밋할 변경사항이 없습니다"
**증상:**
```
⚠️ 커밋할 변경사항이 없습니다
```

**원인:** 파일이 수정되지 않았거나 이미 커밋됨

**확인:**
```bash
git status
```

### Q3: "PowerShell 실행 정책 오류"
**증상:**
```
.\deploy.ps1 : 이 시스템에서 스크립트를 실행할 수 없으므로...
```

**해결:**
```powershell
# 실행 정책 변경
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 다시 실행
.\deploy.ps1 "커밋 메시지"
```

### Q4: "Vercel이 배포를 시작하지 않아요"
**해결:**
1. Vercel 대시보드 → Settings → Git 확인
2. GitHub 저장소가 연결되어 있는지 확인
3. Production Branch 설정 확인 (main 또는 master)
4. 수동 재배포: Vercel 대시보드 → Deployments → "Redeploy"

### Q5: "환경변수가 적용 안 돼요"
**해결:**
1. Vercel 대시보드 → Settings → Environment Variables 확인
2. Production, Preview, Development 모두 체크되어 있는지 확인
3. **재배포 필요!** (환경변수는 빌드 타임에 적용됨)

---

## 🎨 고급 사용법

### 브랜치별 배포

```bash
# feature 브랜치에서 작업
git checkout -b feature/new-feature

# 코드 수정...

# feature 브랜치에 배포 (Preview 배포 생성)
npm run deploy "새 기능 개발 중"

# Vercel이 자동으로 Preview URL 생성
# 예: https://your-app-feature-branch.vercel.app
```

### 롤백 (이전 버전으로 되돌리기)

#### 방법 1: Vercel 대시보드
1. Vercel 대시보드 → Deployments
2. 이전 배포 선택
3. "..." → "Promote to Production"

#### 방법 2: Git
```bash
# 이전 커밋으로 되돌리기
git log --oneline  # 커밋 목록 확인
git revert <commit-hash>
npm run deploy "이전 버전으로 롤백"
```

### CI/CD 파이프라인 확장

`.github/workflows/deploy.yml` 파일을 수정하여:
- 테스트 자동 실행
- 린트 체크
- 타입 체크
- 빌드 최적화
- Slack 알림

---

## 📚 추가 명령어

### Git 상태 확인
```bash
git status
```

### 마지막 커밋 확인
```bash
git log -1
```

### 배포 이력 확인
```bash
git log --oneline
```

### 현재 브랜치 확인
```bash
git branch --show-current
```

---

## 🎯 체크리스트

### 배포 전
- [ ] 코드 수정 완료
- [ ] 로컬에서 테스트 완료
- [ ] 커밋 메시지 준비

### 배포 중
- [ ] `npm run deploy "메시지"` 실행
- [ ] GitHub Push 성공 확인
- [ ] Vercel 배포 시작 확인

### 배포 후
- [ ] Vercel URL 접속 확인
- [ ] 프론트엔드 동작 확인
- [ ] API 엔드포인트 테스트
- [ ] Supabase 데이터 저장 확인

---

## 💬 팁

### 좋은 커밋 메시지 작성법

```bash
# ❌ 나쁜 예
npm run deploy "수정"
npm run deploy "버그"

# ✅ 좋은 예
npm run deploy "AI 요약 API 응답 시간 개선"
npm run deploy "Admin 페이지 UI 리팩토링"
npm run deploy "Supabase 연결 오류 수정"
```

### 자주 사용하는 패턴

```bash
# 기능 추가
npm run deploy "feat: 사용자 알림 기능 추가"

# 버그 수정
npm run deploy "fix: 웹훅 처리 오류 수정"

# 리팩토링
npm run deploy "refactor: API 모듈 구조 개선"

# 문서 업데이트
npm run deploy "docs: README 업데이트"
```

---

## 🎉 완료!

이제 코드를 수정하고 `npm run deploy "메시지"` 한 번이면 자동으로 배포됩니다!

**간단하죠?** 😊

궁금한 점이 있으면 언제든 물어보세요!
