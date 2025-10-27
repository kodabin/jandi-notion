# Vercel 배포 가이드

## 📦 사전 준비사항

### 1. 필수 설치 항목
- Node.js 18 이상
- npm 또는 yarn
- Vercel 계정 (https://vercel.com)

### 2. Vercel CLI 설치 (선택사항)
```bash
npm install -g vercel
```

---

## 🚀 Vercel 배포 방법

### 방법 1: Vercel 웹 대시보드를 통한 배포 (권장)

#### 1단계: GitHub 저장소 준비
```bash
# 프로젝트를 GitHub에 푸시
git add .
git commit -m "Vercel 배포 준비"
git push origin main
```

#### 2단계: Vercel에서 프로젝트 가져오기
1. https://vercel.com 접속 후 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. `jandi-notion-webhook` 저장소 선택
5. **Root Directory** 설정: `frontend` 입력
6. **Framework Preset**: `Create React App` 선택됨 확인
7. **Environment Variables** 추가:
   - Name: `REACT_APP_API_URL`
   - Value: 백엔드 서버 URL (예: `https://your-backend.com`)
8. "Deploy" 클릭

#### 3단계: 배포 완료
- 배포가 완료되면 Vercel이 자동으로 URL 생성
- 예: `https://your-project-name.vercel.app`

---

### 방법 2: Vercel CLI를 통한 배포

#### 1단계: frontend 폴더로 이동
```bash
cd frontend
```

#### 2단계: 환경변수 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 수정
# REACT_APP_API_URL=https://your-backend-server.com
```

#### 3단계: Vercel 배포
```bash
# 첫 배포 (프로젝트 설정)
vercel

# 프로덕션 배포
vercel --prod
```

#### 4단계: 환경변수 설정 (Vercel CLI)
```bash
vercel env add REACT_APP_API_URL
# 프롬프트에 백엔드 URL 입력
```

---

## 🔧 백엔드 서버 설정

### 1. 백엔드 서버에 CORS 설정 확인
백엔드 서버(`server.js`)에 이미 CORS가 설정되어 있습니다:
```javascript
const cors = require('cors');

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1 && !origin.includes('vercel.app')) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
```

### 2. 백엔드 환경변수 추가
백엔드 서버의 `.env` 파일에 다음 추가:
```env
# 프론트엔드 Vercel URL
FRONTEND_URL=https://your-project-name.vercel.app
```

### 3. 백엔드에 cors 패키지 설치
```bash
npm install cors
```

---

## 📋 로컬 개발 환경 설정

### 1. frontend 폴더에서 환경변수 설정
```bash
cd frontend
cp .env.example .env
```

`.env` 파일:
```env
REACT_APP_API_URL=http://localhost:3000
```

### 2. 개발 서버 실행
```bash
# 터미널 1 - 백엔드 실행
npm start

# 터미널 2 - 프론트엔드 실행
cd frontend
npm start
```

프론트엔드는 기본적으로 `http://localhost:3001`에서 실행됩니다.

---

## 🔍 배포 후 확인사항

### 1. 환경변수 확인
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables에서:
- `REACT_APP_API_URL` 설정 확인

### 2. API 연결 테스트
1. Vercel 배포 URL 접속
2. 브라우저 개발자 도구(F12) → Console 탭 확인
3. 네트워크 요청이 백엔드로 정상적으로 전송되는지 확인

### 3. CORS 오류 해결
만약 CORS 오류가 발생하면:
1. 백엔드 서버의 CORS 설정 확인
2. `FRONTEND_URL` 환경변수가 올바르게 설정되었는지 확인
3. 백엔드 서버 재시작

---

## 🌐 도메인 연결 (선택사항)

### 1. Vercel에서 커스텀 도메인 추가
1. Vercel 대시보드 → 프로젝트 → Settings → Domains
2. "Add Domain" 클릭
3. 도메인 입력 (예: `jandi.yourdomain.com`)
4. DNS 설정 안내에 따라 도메인 제공업체에서 설정

### 2. 환경변수 업데이트
커스텀 도메인을 사용하는 경우:
- 백엔드 `.env`의 `FRONTEND_URL` 업데이트
- 백엔드 서버 재시작

---

## 🐛 문제 해결

### Q1: "API 요청이 실패합니다"
**A**:
- Vercel의 Environment Variables에서 `REACT_APP_API_URL` 확인
- 백엔드 서버가 실행 중인지 확인
- 백엔드 서버의 CORS 설정 확인

### Q2: "페이지를 새로고침하면 404 에러가 발생합니다"
**A**:
- `frontend/vercel.json` 파일이 존재하는지 확인
- React Router의 rewrites 설정이 올바른지 확인

### Q3: "환경변수가 적용되지 않습니다"
**A**:
- 환경변수는 빌드 타임에 적용됩니다
- 환경변수 변경 후 Vercel에서 재배포 필요
- Vercel 대시보드 → Deployments → "Redeploy"

### Q4: "빌드가 실패합니다"
**A**:
- `frontend/package.json`의 dependencies 확인
- 로컬에서 `npm run build` 실행하여 오류 확인
- Node.js 버전 확인 (18 이상 권장)

---

## 📊 배포 상태 모니터링

### Vercel 대시보드 활용
1. **Deployments**: 배포 이력 및 상태
2. **Analytics**: 방문자 통계 (Pro 플랜)
3. **Logs**: 런타임 로그 확인
4. **Speed Insights**: 성능 모니터링

---

## 🔄 자동 배포 설정

Vercel은 GitHub와 연동 시 자동으로 다음을 수행합니다:

### Production 배포
- `main` 또는 `master` 브랜치에 푸시 시 자동 배포

### Preview 배포
- Pull Request 생성 시 자동으로 미리보기 URL 생성
- 각 커밋마다 새로운 미리보기 생성

### 특정 브랜치만 배포하기
Vercel 대시보드 → Settings → Git에서:
- Production Branch 설정
- Ignored Build Step 설정 가능

---

## 💡 추가 최적화

### 1. 환경별 설정 분리
```env
# .env.development
REACT_APP_API_URL=http://localhost:3000

# .env.production (Vercel)
REACT_APP_API_URL=https://api.yourdomain.com
```

### 2. 빌드 최적화
`frontend/package.json`의 build 스크립트:
```json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### 3. 캐싱 최적화
Vercel은 자동으로 정적 파일을 캐싱합니다. 추가 설정 불필요.

---

## 📚 참고 문서

- [Vercel 공식 문서](https://vercel.com/docs)
- [Create React App 배포 가이드](https://create-react-app.dev/docs/deployment/)
- [Vercel CLI 문서](https://vercel.com/docs/cli)

---

## 📞 지원

문제가 발생하면:
1. Vercel 대시보드의 Logs 확인
2. GitHub Issues에 문의
3. Vercel 커뮤니티 포럼 활용

---

**배포 완료 후 체크리스트:**
- [ ] Vercel 배포 성공
- [ ] `REACT_APP_API_URL` 환경변수 설정
- [ ] 백엔드 서버 CORS 설정
- [ ] 백엔드 `FRONTEND_URL` 환경변수 추가
- [ ] API 연결 테스트 성공
- [ ] Admin 페이지 접속 확인
- [ ] 웹훅 처리 테스트
