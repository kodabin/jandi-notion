# 빠른 시작 가이드

**목적**: 5분 안에 서버를 실행하고 주요 기능을 테스트합니다.

---

## 1. 서버 실행 (2분)

```bash
# 1단계: 의존성 설치 (처음 한 번만)
npm install
cd frontend && npm install && npm run build && cd ..

# 2단계: 환경변수 설정
cp .env.example .env
# .env 파일 편집 (필수 항목 없음 - 기본 기능 동작)

# 3단계: 서버 시작
npm start
```

**결과:**
```
🚀 잔디-노션 Webhook 서버 시작 (React 통합)
📍 로컬 주소: http://localhost:3000
📍 메인 페이지: http://localhost:3000/
📍 Admin 페이지: http://localhost:3000/admin
📍 Webhook URL: http://localhost:3000/webhook/jandi
```

---

## 2. 기능 테스트 (3분)

### 2.1 메인 페이지 접속
브라우저에서 http://localhost:3000 열기

### 2.2 어드민 대시보드 접속
http://localhost:3000/admin 열기
- 실시간 웹훅 모니터링 확인
- 5초마다 자동 새로고침 확인

### 2.3 웹훅 테스트
**터미널에서 실행:**
```bash
curl -X POST http://localhost:3000/test
```

**기대 결과:**
```json
{
  "success": true,
  "message": "테스트 웹훅 수신 성공",
  "data": { ... },
  "aiSummary": null  // OpenAI API 키 미설정 시
}
```

### 2.4 어드민에서 확인
- http://localhost:3000/admin 새로고침
- "최근 완료" 섹션에 테스트 웹훅 표시 확인

---

## 3. 외부 접속 설정 (선택 - 잔디 연동용)

### ngrok 실행
```bash
# 새 터미널에서
ngrok http 3000
```

**결과:**
```
Forwarding  https://xxxx.ngrok.io -> http://localhost:3000
```

### 잔디 Webhook 설정
1. 잔디 관리자 설정 → Outgoing Webhook 생성
2. URL: `https://xxxx.ngrok.io/webhook/jandi`
3. 트리거 키워드: `/서버` (선택)

### 테스트
잔디 대화방에서 메시지 전송:
```
/서버 테스트 메시지입니다
```

어드민 대시보드에서 실시간으로 처리 과정 확인!

---

## 4. AI 요약 기능 활성화 (선택)

### OpenAI API 키 설정
```bash
# .env 파일 편집
OPENAI_API_KEY=sk-your-api-key-here
```

### 서버 재시작
```bash
# Ctrl+C로 서버 종료 후
npm start
```

### 테스트
```bash
curl -X POST http://localhost:3000/test-ai-summary \
  -H "Content-Type: application/json" \
  -d '{"text":"오늘 회의에서 프로젝트 일정과 예산을 논의했습니다."}'
```

**기대 결과:**
```json
{
  "success": true,
  "summary": "회의에서 프로젝트 일정과 예산 논의."
}
```

---

## 5. 다음 단계

### 학습하기
1. **README.md** - 전체 프로젝트 개요
2. **SYSTEM_PROMPT.md** - 시스템 명세 (백엔드)
3. **docs/claude.md** - 싱글톤 개발 가이드

### 개발하기
1. 프롬프트 파일 수정 (SYSTEM_PROMPT.md)
2. 코드 재생성 (싱글톤 방식)
3. 테스트 및 커밋

### 문의하기
- GitHub Issues
- 프로젝트 문서 참조

---

**소요 시간**: 총 5분
**난이도**: ⭐ (매우 쉬움)
**준비물**: Node.js 18+, npm
