# 배포 가이드

## 📦 프로젝트 구조

이 프로젝트는 **백엔드(Node.js)와 프론트엔드(React)가 분리**되어 있습니다.

```
jandi-notion-webhook/
├── server.js           # 백엔드 서버 (Express)
├── package.json        # 백엔드 의존성
├── .env               # 백엔드 환경변수
│
└── frontend/          # 프론트엔드 (React)
    ├── src/
    ├── package.json   # 프론트엔드 의존성
    ├── .env           # 프론트엔드 환경변수
    └── vercel.json    # Vercel 설정
```

---

## 🚀 배포 시나리오

### 시나리오 1: 백엔드 + 프론트엔드 모두 로컬 실행

#### 1. 백엔드 설정
```bash
# 루트 디렉토리
npm install
npm install cors  # CORS 패키지 추가

# .env 파일 설정
PORT=3000
ANTHROPIC_API_KEY=your_api_key
NOTION_API_KEY=your_notion_key
NOTION_DATABASE_ID=your_db_id
FRONTEND_URL=http://localhost:3001
```

#### 2. 프론트엔드 설정
```bash
cd frontend
npm install

# .env 파일 생성
echo "REACT_APP_API_URL=http://localhost:3000" > .env
```

#### 3. 실행
```bash
# 터미널 1 - 백엔드
npm start

# 터미널 2 - 프론트엔드
cd frontend
npm start
```

- 백엔드: http://localhost:3000
- 프론트엔드: http://localhost:3001

---

### 시나리오 2: 백엔드(로컬/서버) + 프론트엔드(Vercel)

#### 1. 백엔드 설정
```bash
npm install
npm install cors

# .env 파일
PORT=3000
ANTHROPIC_API_KEY=your_api_key
NOTION_API_KEY=your_notion_key
NOTION_DATABASE_ID=your_db_id
FRONTEND_URL=https://your-app.vercel.app  # Vercel URL
```

#### 2. 백엔드 실행
```bash
npm start
```

#### 3. 백엔드를 외부에서 접근 가능하게 만들기

**옵션 A: ngrok 사용 (로컬)**
```bash
npm install -g ngrok
ngrok http 3000

# ngrok URL 복사 (예: https://abc123.ngrok.io)
```

**옵션 B: 서버에 배포**
- Heroku, Railway, Render 등 Node.js 호스팅 서비스 사용
- VPS (AWS EC2, DigitalOcean 등)에 배포

#### 4. Vercel에 프론트엔드 배포

상세한 방법은 [frontend/VERCEL_DEPLOYMENT.md](frontend/VERCEL_DEPLOYMENT.md) 참조

**간단 요약:**
1. https://vercel.com 접속
2. GitHub 저장소 연결
3. Root Directory: `frontend` 입력
4. Environment Variables 추가:
   - `REACT_APP_API_URL` = 백엔드 URL (ngrok URL 또는 서버 URL)
5. Deploy 클릭

---

## 🔧 필수 설치 패키지

### 백엔드 (루트 디렉토리)
```bash
npm install cors
```

**package.json에 추가:**
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "axios": "^1.6.0",
    "@notionhq/client": "^2.2.13",
    "dotenv": "^16.3.1",
    "@anthropic-ai/sdk": "^0.20.0"
  }
}
```

### 프론트엔드
```bash
cd frontend
npm install
```

현재 모든 의존성은 이미 `frontend/package.json`에 포함되어 있습니다.

---

## 📋 환경변수 체크리스트

### 백엔드 (.env)
```env
# 필수
PORT=3000
ANTHROPIC_API_KEY=sk-...        # Claude AI API 키

# 선택 (Notion 연동 시)
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...

# 프론트엔드 URL (CORS용)
FRONTEND_URL=https://your-app.vercel.app

# 잔디 설정 (선택)
JANDI_WEBHOOK_TOKEN=...
JANDI_OUTGOING_WEBHOOK_URL=...
```

### 프론트엔드 (frontend/.env)
```env
# 백엔드 API URL
REACT_APP_API_URL=http://localhost:3000
# 또는 Vercel 배포 시
# REACT_APP_API_URL=https://your-backend.com
```

---

## 🌐 백엔드 배포 옵션

### 옵션 1: Heroku
```bash
# Heroku CLI 설치 후
heroku create your-app-name
heroku config:set ANTHROPIC_API_KEY=your_key
heroku config:set FRONTEND_URL=https://your-app.vercel.app
git push heroku main
```

### 옵션 2: Railway
1. https://railway.app 접속
2. GitHub 저장소 연결
3. 환경변수 설정
4. 자동 배포

### 옵션 3: Render
1. https://render.com 접속
2. "New Web Service" 선택
3. GitHub 저장소 연결
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. 환경변수 추가

### 옵션 4: VPS (AWS EC2, DigitalOcean 등)
```bash
# 서버에서
git clone your-repo
cd jandi-notion-webhook
npm install
npm install cors

# PM2로 실행 (프로세스 관리)
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

---

## 🔍 배포 후 테스트

### 1. 백엔드 테스트
```bash
# 서버 상태 확인
curl https://your-backend.com

# AI 요약 테스트
curl -X POST https://your-backend.com/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"테스트 메시지"}'
```

### 2. 프론트엔드 테스트
1. Vercel URL 접속
2. F12 (개발자 도구) → Console 탭
3. 네트워크 요청 확인
4. Admin 페이지 접속 테스트

### 3. 통합 테스트
1. 프론트엔드에서 "잔디로 메시지 보내기" 테스트
2. AI 요약 기능 테스트
3. Admin 페이지에서 웹훅 모니터링 확인

---

## 🐛 문제 해결

### CORS 오류
**증상:** `Access to fetch at 'https://backend.com' from origin 'https://frontend.vercel.app' has been blocked by CORS policy`

**해결:**
1. 백엔드 `server.js`에 cors 패키지 설치 확인
2. `.env`의 `FRONTEND_URL` 확인
3. 백엔드 서버 재시작

### 환경변수가 적용 안 됨
**프론트엔드 (Vercel):**
- 환경변수 이름이 `REACT_APP_`로 시작하는지 확인
- Vercel에서 재배포 필요 (환경변수는 빌드 타임에 적용됨)

**백엔드:**
- `.env` 파일이 루트 디렉토리에 있는지 확인
- 서버 재시작

### API 연결 실패
1. 백엔드 서버가 실행 중인지 확인
2. 프론트엔드의 `REACT_APP_API_URL` 확인
3. 네트워크 방화벽 설정 확인
4. HTTPS/HTTP 프로토콜 확인

---

## 📚 참고 문서

- [Vercel 배포 가이드](frontend/VERCEL_DEPLOYMENT.md)
- [README.md](README.md) - 프로젝트 개요
- [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md) - 시스템 명세

---

## 🎯 빠른 시작 요약

```bash
# 1. 백엔드에 cors 설치
npm install cors

# 2. 백엔드 환경변수 설정
# .env 파일 생성 및 설정

# 3. 백엔드 실행
npm start

# 4. 프론트엔드 환경변수 설정
cd frontend
echo "REACT_APP_API_URL=http://localhost:3000" > .env

# 5. 프론트엔드 실행 (로컬)
npm start

# 또는 Vercel 배포
# vercel.com에서 배포 후 환경변수 설정
```

---

**배포 성공 체크리스트:**
- [ ] `cors` 패키지 설치됨
- [ ] 백엔드 `.env` 설정 완료
- [ ] 프론트엔드 `.env` 또는 Vercel 환경변수 설정 완료
- [ ] 백엔드 서버 실행 중
- [ ] 프론트엔드 접속 가능
- [ ] API 연결 테스트 성공
- [ ] CORS 오류 없음
