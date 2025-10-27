# Vercel Serverless Functions를 이용한 완전한 배포 가이드

## 🎯 개요

이 프로젝트는 **Vercel Serverless Functions**를 이용하여 **프론트엔드와 백엔드를 하나의 프로젝트**로 배포합니다.

```
배포 구조:
https://your-app.vercel.app/          → 프론트엔드 (React)
https://your-app.vercel.app/api/*     → 백엔드 API (Serverless Functions)
```

---

## 📦 필수 설치 항목

### 이미 설치 완료된 것
- ✅ `npm install cors` (완료)
- ✅ 기존 의존성 패키지들 (package.json에 포함)

### 추가 설치 필요 없음
모든 패키지가 이미 설치되어 있습니다!

---

## 🗂 프로젝트 구조

```
jandi-notion-webhook/
├── api/                        # 🔥 Vercel Serverless Functions
│   ├── _utils/                 # 공통 유틸리티
│   │   ├── notion.js           # Notion API 클라이언트
│   │   ├── anthropic.js        # Claude AI 클라이언트
│   │   └── storage.js          # 메모리 기반 저장소
│   │
│   ├── webhook/
│   │   └── jandi.js            # POST /api/webhook/jandi
│   │
│   ├── admin/
│   │   ├── webhooks.js         # GET /api/admin/webhooks
│   │   └── retry-ai-summary.js # POST /api/admin/retry-ai-summary
│   │
│   ├── logs.js                 # GET /api/logs
│   ├── test-ai-summary.js      # POST /api/test-ai-summary
│   └── send-to-jandi.js        # POST /api/send-to-jandi
│
├── frontend/                   # React 프론트엔드
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vercel.json             # 프론트엔드 Vercel 설정
│   └── .env.example
│
├── vercel.json                 # 🔥 루트 Vercel 설정 (중요!)
├── package.json                # 루트 의존성
├── server.js                   # (기존 파일 - 참고용으로 보관)
└── .env                        # 환경변수 (Git에 커밋하지 않음)
```

---

## 🚀 Vercel 배포 방법

### 1단계: GitHub에 푸시

```bash
git add .
git commit -m "Vercel Serverless Functions로 마이그레이션"
git push origin main
```

### 2단계: Vercel에서 프로젝트 생성

1. **https://vercel.com** 접속 후 로그인
2. **"New Project"** 클릭
3. **GitHub 저장소 연결**
4. `jandi-notion-webhook` 저장소 선택

### 3단계: 프로젝트 설정

#### 중요! Root Directory 설정
- **Root Directory**: 비워두기 (루트 디렉토리 사용)
- **Framework Preset**: Other (자동 감지됨)

#### Build & Development Settings
Vercel이 자동으로 감지합니다. 수동 설정 시:
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/build`
- **Install Command**: `npm install`

### 4단계: 환경변수 설정 (필수!)

Vercel 대시보드 → Settings → Environment Variables에서 다음 추가:

```env
# 필수 - Claude AI API 키
ANTHROPIC_API_KEY=sk-ant-...

# 선택 - Notion 연동 시
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=2709c417...

# 선택 - 잔디 메시지 전송 시
JANDI_OUTGOING_WEBHOOK_URL=https://wh.jandi.com/connect-api/webhook/...
JANDI_WEBHOOK_TOKEN=your_token
```

**중요**: 각 환경변수는 다음 환경에 추가:
- ✅ Production
- ✅ Preview
- ✅ Development

### 5단계: 배포!

**"Deploy"** 버튼 클릭!

배포가 완료되면:
- 프론트엔드: `https://your-app.vercel.app`
- API: `https://your-app.vercel.app/api/*`

---

## 🧪 배포 후 테스트

### 1. 프론트엔드 접속
```
https://your-app.vercel.app
```

### 2. Admin 페이지 접속
```
https://your-app.vercel.app/admin
```

### 3. API 엔드포인트 테스트

#### AI 요약 테스트
```bash
curl -X POST https://your-app.vercel.app/api/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"오늘 회의에서 새로운 기능 개발에 대해 논의했습니다."}'
```

#### 웹훅 시뮬레이션
```bash
curl -X POST https://your-app.vercel.app/api/webhook/jandi \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "테스트팀",
    "roomName": "테스트룸",
    "userName": "홍길동",
    "text": "테스트 메시지입니다.",
    "createdAt": "2025-10-27T00:00:00Z"
  }'
```

#### 로그 조회
```bash
curl https://your-app.vercel.app/api/logs
```

---

## 🌐 잔디 Webhook 설정

### 1. Vercel URL 복사
배포 완료 후 Vercel URL을 복사합니다.
예: `https://jandi-notion-webhook.vercel.app`

### 2. 잔디 관리자 설정
1. 잔디 관리자 페이지 접속
2. 원하는 대화방 → **"Outgoing Webhook"** 설정
3. **Webhook URL**:
   ```
   https://your-app.vercel.app/api/webhook/jandi
   ```
4. **트리거 단어**: (선택) `/서버` 등
5. 저장!

### 3. 테스트
잔디 대화방에서 메시지를 보내면:
1. Vercel Serverless Function이 자동 실행
2. Claude AI가 메시지 요약
3. Notion에 자동 저장 (설정 시)
4. Admin 페이지에서 실시간 확인 가능

---

## 🔧 로컬 개발 환경

### 옵션 1: Vercel CLI 사용 (권장)

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 링크
vercel link

# 환경변수 다운로드
vercel env pull

# 로컬 개발 서버 실행
vercel dev
```

접속: http://localhost:3000

### 옵션 2: 기존 방식 (별도 서버)

```bash
# 터미널 1 - 백엔드 (기존 server.js)
npm start

# 터미널 2 - 프론트엔드
cd frontend
npm start
```

- 백엔드: http://localhost:3000
- 프론트엔드: http://localhost:3001

---

## 📊 API 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/webhook/jandi` | 잔디 웹훅 수신 |
| GET | `/api/admin/webhooks` | 웹훅 상태 조회 |
| POST | `/api/admin/retry-ai-summary` | AI 요약 재생성 |
| GET | `/api/logs` | 로그 조회 |
| POST | `/api/test-ai-summary` | AI 요약 테스트 |
| POST | `/api/send-to-jandi` | 잔디로 메시지 전송 |

---

## ⚠️ 중요 사항

### 1. 메모리 기반 저장소 제약
현재 로그와 웹훅 상태는 **메모리에 저장**됩니다.

**제약사항:**
- Serverless Function이 재시작되면 데이터 손실
- 여러 Function 인스턴스 간 데이터 공유 불가

**프로덕션 권장사항:**
- Vercel KV (Redis) 사용
- Vercel Postgres 사용
- 외부 DB (MongoDB, PostgreSQL 등) 연결

### 2. Vercel Serverless 제한
- 함수 실행 시간: 최대 60초 (Hobby), 300초 (Pro)
- 메모리: 최대 1024MB (Hobby), 3008MB (Pro)
- 응답 크기: 최대 4.5MB

### 3. Cold Start
- 첫 요청 시 함수가 초기화되어 응답이 느릴 수 있음
- 자주 사용되는 함수는 warm 상태로 유지됨

---

## 🎛 Vercel 대시보드 활용

### Deployments
- 배포 이력 확인
- Preview 배포 URL 확인
- 롤백 기능

### Logs
- 실시간 로그 확인
- 에러 추적
- 필터링

### Analytics (Pro)
- 방문자 통계
- 성능 지표

### Environment Variables
- 환경변수 관리
- 환경별 설정 (Production, Preview, Development)

---

## 🐛 문제 해결

### Q1: "API 요청이 404 에러"
**A**:
- Vercel 배포 후 API 경로가 `/api/`로 시작하는지 확인
- `vercel.json` 파일이 루트에 있는지 확인
- Vercel Logs에서 에러 확인

### Q2: "환경변수가 적용 안 됨"
**A**:
- Vercel 대시보드 → Settings → Environment Variables 확인
- Production, Preview, Development 모두 설정했는지 확인
- 재배포 필요 (환경변수는 빌드 타임에 적용됨)

### Q3: "AI 요약이 생성되지 않음"
**A**:
- `ANTHROPIC_API_KEY` 환경변수 확인
- Vercel Logs에서 에러 메시지 확인
- API 키가 유효한지 확인

### Q4: "Function timeout 에러"
**A**:
- Claude AI API 응답이 너무 느릴 수 있음
- Vercel Pro 플랜으로 업그레이드 (타임아웃 300초)
- AI 모델 변경 고려

### Q5: "데이터가 사라짐"
**A**:
- 메모리 기반 저장소 사용 중
- Vercel KV 또는 외부 DB로 마이그레이션 필요

---

## 🔄 자동 배포

### Git 브랜치별 자동 배포
- `main` 브랜치 푸시 → Production 자동 배포
- Pull Request 생성 → Preview 배포 자동 생성
- 각 커밋마다 새로운 배포 생성

### 배포 알림
Vercel 대시보드 → Settings → Notifications에서:
- 이메일 알림
- Slack 연동
- Discord 연동

---

## 📈 성능 최적화

### 1. Edge Functions 사용 (선택)
글로벌 엣지 네트워크에서 함수 실행:
```javascript
// api/_middleware.js
export const config = {
  runtime: 'edge',
};
```

### 2. 캐싱
```javascript
// API 응답에 캐시 헤더 추가
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
```

### 3. 프론트엔드 최적화
```bash
# 빌드 시 소스맵 제거
cd frontend
GENERATE_SOURCEMAP=false npm run build
```

---

## 💾 Vercel KV로 업그레이드 (선택)

### 1. Vercel KV 생성
1. Vercel 대시보드 → Storage → Create Database
2. KV (Redis) 선택
3. 프로젝트 연결

### 2. 환경변수 자동 추가됨
```env
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

### 3. 코드 수정
```javascript
// api/_utils/storage.js
import { kv } from '@vercel/kv';

// 로그 저장
await kv.lpush('logs', JSON.stringify(logData));
await kv.ltrim('logs', 0, 99); // 최근 100개만 유지

// 로그 조회
const logs = await kv.lrange('logs', 0, -1);
```

---

## 📚 참고 자료

- [Vercel Serverless Functions 공식 문서](https://vercel.com/docs/functions)
- [Vercel KV 문서](https://vercel.com/docs/storage/vercel-kv)
- [Vercel CLI 문서](https://vercel.com/docs/cli)
- [Claude API 문서](https://docs.anthropic.com/)
- [Notion API 문서](https://developers.notion.com/)

---

## ✅ 배포 체크리스트

### 배포 전
- [ ] GitHub에 코드 푸시 완료
- [ ] `.env` 파일이 `.gitignore`에 포함되었는지 확인
- [ ] 환경변수 값 준비 (ANTHROPIC_API_KEY 등)

### Vercel 설정
- [ ] Root Directory: 비워두기
- [ ] 환경변수 추가 (Production, Preview, Development)
- [ ] Deploy 클릭

### 배포 후
- [ ] 프론트엔드 접속 확인
- [ ] Admin 페이지 접속 확인
- [ ] API 엔드포인트 테스트
- [ ] 잔디 Webhook URL 설정
- [ ] 실제 메시지 전송 테스트
- [ ] AI 요약 작동 확인
- [ ] (선택) Notion 저장 확인

---

## 🎉 완료!

축하합니다! Vercel Serverless Functions를 사용하여 전체 시스템을 배포했습니다.

**배포 URL 예시:**
- 메인: `https://jandi-notion-webhook.vercel.app`
- Admin: `https://jandi-notion-webhook.vercel.app/admin`
- Webhook: `https://jandi-notion-webhook.vercel.app/api/webhook/jandi`

문제가 발생하면 Vercel Logs를 확인하거나 GitHub Issues에 문의하세요!
