# 잔디-노션 Webhook 연동 서버

잔디의 Outgoing Webhook을 수신하여 노션 데이터베이스에 자동으로 저장하는 Node.js 서버입니다.

## 🚀 빠른 시작 가이드

### 1. 프로젝트 설정

```bash
# 1. 프로젝트 폴더 생성
mkdir jandi-notion-webhook
cd jandi-notion-webhook

# 2. 파일 생성 (위의 코드들을 각각 저장)
# - server.js
# - package.json
# - .env

# 3. 의존성 설치
npm install

# 4. 서버 시작
npm start
```

### 2. 노션 설정

#### 2-1. 노션 API 키 발급
1. [Notion Integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름 입력 후 생성
4. "Internal Integration Token" 복사 → `.env` 파일의 `NOTION_API_KEY`에 붙여넣기

#### 2-2. 노션 데이터베이스 생성
1. 노션에서 새 데이터베이스 생성 (Table 또는 Database)
2. 다음 속성(Properties) 추가:
   - 제목 (Title) - 기본 속성
   - 내용 (Text)
   - 작성자 (Text)
   - 대화방 (Select)
   - 팀 (Select)
   - 작성일 (Date)

#### 2-3. 데이터베이스 ID 찾기
1. 데이터베이스 페이지 URL 확인
   - 예: `https://notion.so/myworkspace/8a5b6c7d8e9f0123456789abcdef?v=...`
2. `8a5b6c7d8e9f0123456789abcdef` 부분이 데이터베이스 ID
3. `.env` 파일의 `NOTION_DATABASE_ID`에 입력

#### 2-4. Integration 연결
1. 노션 데이터베이스 페이지에서 우측 상단 "..." 클릭
2. "Add connections" → 생성한 Integration 선택

### 3. 외부 접속 설정 (ngrok 사용)

로컬 서버를 외부에서 접근 가능하게 만들기:

```bash
# ngrok 설치 (한 번만)
npm install -g ngrok

# ngrok 실행 (별도 터미널)
ngrok http 3000

# 생성된 URL 확인 (예: https://abc123.ngrok.io)
```

### 4. 잔디 Webhook 설정

1. 잔디 관리자 설정 접속
2. 원하는 대화방에서 "Outgoing Webhook" 생성
3. 설정 입력:
   - **URL**: `https://your-ngrok-url.ngrok.io/webhook/jandi`
   - **트리거 단어**: (선택) 특정 키워드 또는 모든 메시지
   - **토큰**: (선택) 보안용 토큰 생성

## 📂 프로젝트 구조

```
jandi-notion-webhook/
├── server.js           # 메인 서버 파일
├── package.json        # 프로젝트 설정
├── .env               # 환경 변수 (Git에 포함하지 않음!)
├── .gitignore         # Git 제외 파일
├── webhook_logs.json  # Webhook 로그 (자동 생성)
└── README.md          # 이 파일
```

## 🔧 환경 변수 설정

`.env` 파일 예시:

```env
# 서버 설정
PORT=3000
SERVER_URL=https://your-domain.com

# 노션 설정 (필수)
NOTION_API_KEY=secret_abcd1234...
NOTION_DATABASE_ID=8a5b6c7d8e9f...

# 잔디 설정 (선택)
JANDI_WEBHOOK_TOKEN=your_secret_token
```

## 🧪 테스트

### 서버 상태 확인
브라우저에서 `http://localhost:3000` 접속

### 테스트 메시지 전송
```bash
curl -X POST http://localhost:3000/test
```

### 로그 확인
```bash
# 로그 조회
curl http://localhost:3000/logs

# 또는 파일 직접 확인
cat webhook_logs.json
```

## 🚨 문제 해결

### 1. 노션 연동 실패
- API 키 확인
- 데이터베이스 ID 확인
- Integration이 데이터베이스에 연결되었는지 확인
- 데이터베이스 속성명이 코드와 일치하는지 확인

### 2. 잔디 Webhook 수신 안됨
- ngrok URL이 올바른지 확인
- 잔디 Outgoing Webhook 설정 확인
- 서버 로그 확인 (`console.log` 출력)

### 3. 포트 충돌
`.env` 파일에서 `PORT` 변경:
```env
PORT=3001
```

## 🔒 보안 권장사항

1. **환경 변수 보호**
   - `.env` 파일을 절대 Git에 커밋하지 않기
   - `.gitignore`에 `.env` 추가

2. **토큰 사용**
   - 잔디와 서버 간 `JANDI_WEBHOOK_TOKEN` 설정
   - HTTPS 사용 (ngrok 또는 실제 도메인)

3. **접근 제한**
   - 프로덕션에서는 IP 화이트리스트 고려
   - Rate limiting 구현

## 📝 커스터마이징

### 메시지 필터링 추가
```javascript
// server.js의 webhook 처리 부분에 추가
if (text.includes('#노션저장')) {
    // 특정 태그가 있을 때만 저장
}
```

### 추가 메타데이터
노션 데이터베이스에 태그, 우선순위 등 속성 추가 가능

## 🚀 프로덕션 배포

### 옵션 1: Heroku
```bash
heroku create your-app-name
heroku config:set NOTION_API_KEY=your_key
git push heroku main
```

### 옵션 2: AWS/GCP/Azure
각 클라우드 제공자의 Node.js 배포 가이드 참조

### 옵션 3: VPS
PM2를 사용한 프로세스 관리:
```bash
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

## 📧 지원

문제가 있으시면 다음을 확인하세요:
- 서버 로그 (`/logs` 엔드포인트)
- 콘솔 출력
- 노션 API 문서
- 잔디 Webhook 문서