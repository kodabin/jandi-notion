# Claude Code 개발 가이드

## 문서 목적
이 문서는 Claude Code(또는 기타 AI 코드 어시스턴트)를 사용하여 잔디-노션 웹훅 시스템을 개발/유지보수할 때의 규칙과 베스트 프랙티스를 정의합니다.

---

## 1. 싱글톤(Single-turn) 개발 원칙

### 1.1 핵심 철학
```
🎯 프롬프트 한 번으로 전체 시스템 생성
🔄 수정 시 롤백 후 프롬프트 수정 → 재생성
📐 멱등성 보장: 같은 프롬프트 = 같은 결과
```

### 1.2 왜 싱글톤인가?

#### ❌ 점진적 수정의 문제점
```
1차: "로그인 기능 추가해줘"
2차: "회원가입도 추가해줘"
3차: "비밀번호 암호화 해줘"
4차: "아 그리고 이메일 인증도..."

→ 결과: 맥락 손실, 코드 일관성 저하, 유지보수 불가
```

#### ✅ 싱글톤 방식
```markdown
# 사용자 인증 시스템 - 싱글톤 프롬프트

## 요구사항
1. 회원가입 (이메일 인증 포함)
2. 로그인 (JWT 토큰 기반)
3. 비밀번호 암호화 (bcrypt)
4. 비밀번호 찾기

## Input/Output 명세
...

## API 명세
...
```

→ 결과: 명확한 스펙, 일관된 코드, 추적 가능한 변경 이력

---

## 2. 프롬프트 작성 규칙

### 2.1 추상화 수준
```
👍 좋은 예: "잔디 웹훅을 받아서 AI 요약 후 Notion에 저장"
👎 나쁜 예: "Express router를 사용해서 POST /webhook 엔드포인트를..."
```

**원칙:**
- **What** (무엇을)에 집중, **How** (어떻게)는 AI에게 위임
- 비즈니스 로직과 요구사항 중심
- 기술 스택은 명시하되, 구현 세부사항은 최소화

### 2.2 필수 포함 요소
```markdown
1. Input 예시 (실제 데이터 구조)
2. Output 예시 (기대하는 결과)
3. 에러 케이스 (예외 상황)
4. 제약사항 (성능, 보안 등)
5. 환경변수 명세
```

### 2.3 프롬프트 템플릿
```markdown
# [기능명] - 싱글톤 프롬프트

## 메타 정보
- 버전: 1.0.0
- 생성일: YYYY-MM-DD
- 멱등성: ✅

## 1. 개요
[기능의 목적과 역할]

## 2. Input/Output 명세
```json
// Input 예시 (실제 데이터)
{
  "field1": "value1"
}

// Output 예시 (기대 결과)
{
  "result": "success"
}
```

## 3. 기술 스택
- Runtime: Node.js 18+
- Framework: Express
...

## 4. API 명세
[RESTful API 또는 함수 시그니처]

## 5. 에러 처리
[예외 상황과 처리 방법]

## 6. 환경변수
```env
REQUIRED_VAR=value
OPTIONAL_VAR=default_value
```

## 7. 테스트 시나리오
[수동/자동 테스트 케이스]
```

---

## 3. Vibe Coding vs. 구조적 프롬프팅

### 3.1 Vibe Coding (즉흥적)
```
개발자: "채팅 기능 만들어줘"
AI: [코드 생성]
개발자: "실시간으로 되게 해줘"
AI: [WebSocket 추가]
개발자: "아 그리고 읽음 표시도"
AI: [기능 추가]
개발자: "이상하게 동작하는데?"
AI: [디버깅 시도]
...
```

**문제점:**
- 전체 구조 파악 불가
- 중복 코드 발생
- 테스트 불가능
- 협업 불가능

### 3.2 구조적 프롬프팅 (싱글톤)
```markdown
# 실시간 채팅 시스템 - 싱글톤 프롬프트

## 기능 요구사항
1. 실시간 메시지 송수신 (WebSocket)
2. 읽음 표시
3. 타이핑 인디케이터
4. 메시지 히스토리 (최근 100개)

## 기술 스택
- WebSocket: Socket.io
- 데이터베이스: Redis (세션 관리)
- 메시지 저장: MongoDB

## API 명세
...
```

**장점:**
- 전체 그림 명확
- 일관성 보장
- 테스트 가능
- 문서화 자동

---

## 4. 코드 수정 워크플로우

### 4.1 기본 워크플로우
```
1. 문제 발견
   ↓
2. 프롬프트 파일 (예: SYSTEM_PROMPT.md) 수정
   ↓
3. Git rollback으로 이전 상태로 복원
   ↓
4. 수정된 프롬프트로 전체 재생성
   ↓
5. 테스트 통과 확인
   ↓
6. Git commit
```

### 4.2 예시: AI 요약 로직 변경
```bash
# 1. 문제: AI 요약이 너무 길게 생성됨

# 2. SYSTEM_PROMPT.md 수정
# Before:
"핵심 내용을 1-2문장으로 요약해주세요."

# After:
"핵심 내용을 최대 50자 이내, 1문장으로 요약해주세요."

# 3. 코드 롤백
git reset --hard HEAD

# 4. Claude에게 프롬프트 전달
# "SYSTEM_PROMPT.md를 읽고 server.js를 재생성해주세요"

# 5. 테스트
npm test

# 6. 커밋
git add .
git commit -m "AI 요약 길이 제한 (최대 50자)"
```

---

## 5. 프롬프트 파일 관리

### 5.1 파일 구조
```
프로젝트/
├── SYSTEM_PROMPT.md       # 전체 시스템 명세
├── ADMIN_PROMPT.md        # 어드민 기능 명세
├── docs/
│   ├── agent.md           # AI 에이전트 명세
│   ├── claude.md          # 이 문서
│   └── api.md             # API 상세 명세
└── .prompts/
    ├── v1.0.0.md          # 버전별 프롬프트 백업
    └── v1.1.0.md
```

### 5.2 버전 관리
```bash
# 새 버전 생성 시
cp SYSTEM_PROMPT.md .prompts/v1.1.0.md
git add .prompts/v1.1.0.md
git commit -m "백업: SYSTEM_PROMPT v1.1.0"

# 이전 버전으로 롤백
cp .prompts/v1.0.0.md SYSTEM_PROMPT.md
```

---

## 6. Claude Code 사용 팁

### 6.1 효과적인 질문 방법

#### ❌ 나쁜 예
```
"이 코드가 왜 안 돼?"
"에러 나는데?"
"고쳐줘"
```

#### ✅ 좋은 예
```
"SYSTEM_PROMPT.md 7.2절의 AI 요약 재시도 로직이
현재 server.js의 retrySummarizeText 함수와
다르게 구현되어 있습니다.

현재 구현:
- 단순 재호출

명세:
- 로그에서 원본 데이터 로드
- isRetry 플래그 설정

SYSTEM_PROMPT.md 명세대로 재구현해주세요."
```

### 6.2 컨텍스트 제공
```markdown
# Claude에게 전달할 정보

1. 관련 프롬프트 파일 경로
   - "SYSTEM_PROMPT.md의 5.3절 참조"

2. 현재 동작
   - "현재는 에러 발생 시 null 반환"

3. 기대 동작
   - "명세에 따르면 '요약 생성에 실패했습니다' 반환"

4. 재현 방법
   - "curl -X POST http://localhost:3000/test-ai-summary -d '{\"text\":\"\"}'로 테스트"
```

### 6.3 대화 흐름 관리
```
Session 1: 시스템 생성
- "SYSTEM_PROMPT.md를 읽고 전체 시스템을 생성해주세요"
- [코드 생성 완료]
- [테스트 완료]
- [대화 종료]

Session 2: 기능 추가
- "ADMIN_PROMPT.md를 읽고 어드민 페이지를 추가해주세요"
- [코드 생성 완료]
- [테스트 완료]
- [대화 종료]

Session 3: 버그 수정
- "SYSTEM_PROMPT.md 9.2절 명세대로 에러 처리를 수정해주세요"
- [코드 수정 완료]
- [테스트 완료]
- [대화 종료]
```

**원칙:**
- 한 세션은 하나의 명확한 목표
- 완료 후 즉시 종료
- 다음 세션은 깨끗한 상태에서 시작

---

## 7. 협업 시 규칙

### 7.1 팀원 온보딩
```markdown
# 새 팀원에게 전달할 문서

1. README.md (프로젝트 개요)
2. SYSTEM_PROMPT.md (전체 시스템 명세)
3. ADMIN_PROMPT.md (어드민 명세)
4. docs/claude.md (이 문서)

# 온보딩 절차
1. 위 문서 숙지 (30분)
2. 로컬 환경 세팅 (README.md 참조)
3. 테스트 실행으로 정상 동작 확인
4. 간단한 기능 추가 연습
   - 새 프롬프트 작성
   - Claude로 코드 생성
   - Pull Request
```

### 7.2 코드 리뷰 체크리스트
```markdown
## Pull Request 체크리스트

- [ ] 프롬프트 파일이 함께 수정되었는가?
- [ ] 프롬프트와 코드가 일치하는가?
- [ ] 테스트가 통과하는가?
- [ ] 환경변수가 문서화되었는가?
- [ ] 에러 처리가 명세대로 구현되었는가?
```

### 7.3 충돌 해결
```bash
# 시나리오: 두 팀원이 동시에 SYSTEM_PROMPT.md 수정

# 팀원 A: AI 요약 로직 변경
# 팀원 B: Notion 연동 활성화

# 해결 방법:
1. SYSTEM_PROMPT.md 충돌 해결 (수동)
2. 양쪽 코드 모두 삭제
3. 통합된 프롬프트로 전체 재생성
4. 테스트 통과 확인
```

---

## 8. 디버깅 전략

### 8.1 문제 진단 순서
```
1. 로그 확인
   - webhook_logs.json
   - 서버 콘솔 출력

2. 프롬프트와 코드 비교
   - "SYSTEM_PROMPT.md 명세와 일치하는가?"

3. 환경변수 확인
   - .env 파일이 올바른가?
   - API 키가 유효한가?

4. 외부 API 상태 확인
   - OpenAI API 정상?
   - Notion API 정상?

5. 테스트 케이스 실행
   - 단위 테스트
   - 통합 테스트
```

### 8.2 Claude와 디버깅하기
```markdown
# Claude에게 보낼 정보

## 문제
"/admin/webhooks API가 빈 배열을 반환합니다"

## 기대 동작 (SYSTEM_PROMPT.md 5.2절)
"processing과 recent 배열에 웹훅 데이터가 포함되어야 함"

## 현재 동작
```json
{
  "processing": [],
  "recent": []
}
```

## 로그
```json
[
  {
    "timestamp": "2025-10-10T00:22:04.519Z",
    "eventType": "webhook_received",
    "webhookId": "webhook_xxx",
    ...
  }
]
```

## 재현 방법
1. POST /webhook/jandi (웹훅 전송)
2. GET /admin/webhooks (조회)
3. 결과: 빈 배열

## 환경
- Node.js v18.0.0
- Express v4.18.2
```

---

## 9. 고급 프롬프팅 기법

### 9.1 제약 조건 명시
```markdown
# 성능 제약
- API 응답 시간: 평균 2초 이내
- 동시 처리: 최대 100 req/s
- 메모리 사용: 최대 512MB

# 보안 제약
- API 키는 환경변수에만 저장
- 민감 정보 로깅 금지
- HTTPS 필수 (프로덕션)

# 코드 스타일
- ESLint 규칙 준수
- TypeScript strict 모드
- 함수는 50줄 이하
```

### 9.2 에러 시나리오 명시
```markdown
# 에러 케이스 1: OpenAI API 타임아웃
Input: 긴 텍스트 (5000자)
Expected: "요약 생성에 실패했습니다"
HTTP Status: 200 (에러를 내부에서 처리)

# 에러 케이스 2: Notion API Rate Limit
Input: 짧은 시간에 대량 요청
Expected: 429 에러 반환
Retry-After 헤더 포함

# 에러 케이스 3: 잘못된 환경변수
Input: NOTION_DATABASE_ID 누락
Expected: 서버 시작 시 경고 로그
기능은 비활성화되지만 서버는 실행
```

### 9.3 예시 기반 명세
```markdown
# 잔디 웹훅 예시 (실제 데이터)
```json
{
  "token": "4a00f0161665d4745285ebd2d1b7f2c2",
  "teamName": "님버스테크(주)",
  "roomName": "test",
  "text": "/서버 테스트",
  "data": "테스트",
  "keyword": "서버",
  "createdAt": "2025-10-10T00:22:23.602Z"
}
```

# 처리 결과 예시
```json
{
  "success": true,
  "webhookId": "webhook_1760055743802_d0ummuovb",
  "aiSummary": "서버 테스트 메시지.",
  "timing": {
    "webhookReceived": "2025-10-10T00:22:23.802Z"
  }
}
```
```

---

## 10. 프롬프트 최적화

### 10.1 불필요한 정보 제거
```markdown
❌ 나쁜 예:
"Express.js의 router.post() 메서드를 사용하여
body-parser 미들웨어로 파싱된 req.body에서
text, userName 등의 필드를 추출하고..."

✅ 좋은 예:
"POST /webhook/jandi 엔드포인트는
잔디 웹훅 데이터를 수신하여
AI 요약 후 Notion에 저장합니다.

Input: (3.1절 참조)
Output: (3.2절 참조)"
```

### 10.2 참조 활용
```markdown
# 잘못된 방식: 모든 내용을 반복
"AI 요약은 OpenAI의 gpt-3.5-turbo 모델을 사용하며,
시스템 프롬프트는 '당신은 한국어 텍스트를...'이고,
max_tokens는 150이며, temperature는 0.3입니다.
이는 agent.md에서도 설명했듯이..."

# 올바른 방식: 간결한 참조
"AI 요약 명세는 docs/agent.md 2.1절 참조"
```

---

## 11. 멱등성 검증

### 11.1 테스트 방법
```bash
# 같은 프롬프트로 3번 생성
for i in {1..3}; do
  git reset --hard HEAD
  claude generate --prompt SYSTEM_PROMPT.md
  cp server.js server_v$i.js
done

# 파일 비교 (diff가 없어야 함)
diff server_v1.js server_v2.js
diff server_v2.js server_v3.js
```

### 11.2 멱등성 보장 방법
```markdown
# 프롬프트에서 비결정적 요소 제거

❌ 나쁜 예:
"현재 날짜를 기준으로..."
"랜덤하게 선택..."
"최신 버전을 사용..."

✅ 좋은 예:
"2025-10-10을 기준으로..."
"알파벳 순으로 정렬..."
"Express 4.18.2를 사용..."
```

---

## 12. 문서 동기화

### 12.1 코드 변경 시
```bash
# 워크플로우
1. 프롬프트 파일 수정
2. Claude로 코드 재생성
3. 테스트
4. Git commit (프롬프트 + 코드 함께)

# Commit Message 규칙
feat: Add AI summary retry feature

- SYSTEM_PROMPT.md: 7.2절에 재시도 로직 추가
- server.js: retrySummarizeText 함수 구현
- ADMIN_PROMPT.md: 재시도 버튼 UI 명세 추가
```

### 12.2 문서 검증
```bash
# 주기적으로 검증 (CI/CD)
npm run verify-docs

# verify-docs 스크립트 예시
#!/bin/bash
echo "Checking prompt-code consistency..."

# SYSTEM_PROMPT.md의 API 엔드포인트 목록
ENDPOINTS=$(grep -o "POST /[a-z-]*" SYSTEM_PROMPT.md)

# server.js의 실제 구현
IMPLEMENTED=$(grep -o "app.post('/[a-z-]*" server.js)

# 비교
if [ "$ENDPOINTS" != "$IMPLEMENTED" ]; then
  echo "❌ 프롬프트와 코드가 불일치!"
  exit 1
fi

echo "✅ 문서 검증 통과"
```

---

## 13. 엔터프라이즈 고려사항

### 13.1 대규모 팀에서의 사용
```markdown
# 역할 분담
- PM: 비즈니스 요구사항 → 프롬프트 초안 작성
- Tech Lead: 기술 스택 및 아키텍처 결정
- Developer: 프롬프트 세부 명세 작성
- Claude: 코드 생성
- QA: 테스트 및 검증

# 프롬프트 리뷰 프로세스
1. 개발자가 프롬프트 작성 (Pull Request)
2. Tech Lead 리뷰 (기술 타당성)
3. PM 리뷰 (비즈니스 요구사항 일치 여부)
4. 승인 후 Claude로 코드 생성
5. QA 테스트
6. Merge
```

### 13.2 규모 확장
```markdown
# 프롬프트 모듈화
project/
├── prompts/
│   ├── core/
│   │   ├── auth.md           # 인증 모듈
│   │   ├── api.md            # API 모듈
│   │   └── database.md       # DB 모듈
│   ├── features/
│   │   ├── chat.md           # 채팅 기능
│   │   ├── notification.md   # 알림 기능
│   │   └── analytics.md      # 분석 기능
│   └── MASTER_PROMPT.md      # 전체 통합 명세

# 사용 방법
claude generate --prompt prompts/MASTER_PROMPT.md --import "core/*.md" "features/*.md"
```

---

## 14. 트러블슈팅

### 14.1 자주 발생하는 문제

#### 문제 1: Claude가 프롬프트를 무시함
```
원인: 프롬프트가 너무 길거나 모호함
해결:
- 핵심만 남기고 세부사항은 별도 문서로 분리
- "docs/agent.md 2.1절 참조" 형식으로 참조
```

#### 문제 2: 생성된 코드가 매번 다름
```
원인: 프롬프트에 비결정적 요소 포함
해결:
- "현재 시간", "랜덤", "최신" 같은 표현 제거
- 구체적인 값과 버전 명시
```

#### 문제 3: 이전 대화 맥락이 영향을 줌
```
원인: Claude가 세션 내 이전 대화를 기억
해결:
- 새 기능 개발 시 새 세션 시작
- "이전 대화 무시하고 SYSTEM_PROMPT.md만 참조해주세요" 명시
```

---

## 15. 참고 자료

### 15.1 내부 문서
- [SYSTEM_PROMPT.md](../SYSTEM_PROMPT.md): 전체 시스템 명세
- [ADMIN_PROMPT.md](../ADMIN_PROMPT.md): 어드민 기능 명세
- [agent.md](./agent.md): AI 에이전트 명세
- [README.md](../README.md): 프로젝트 개요

### 15.2 외부 자료
- [Anthropic Prompt Engineering](https://docs.anthropic.com/claude/docs/prompt-engineering)
- [OpenAI Best Practices](https://platform.openai.com/docs/guides/prompt-engineering)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

## 16. 체크리스트

### 프롬프트 작성 전
- [ ] 요구사항이 명확한가?
- [ ] Input/Output 예시가 준비되었는가?
- [ ] 제약사항을 파악했는가?
- [ ] 에러 케이스를 고려했는가?

### 프롬프트 작성 후
- [ ] 추상화 수준이 적절한가? (너무 구체적이지 않은가?)
- [ ] 예시가 실제 데이터인가? (가상 데이터 X)
- [ ] 멱등성이 보장되는가?
- [ ] 참조가 명확한가?

### 코드 생성 후
- [ ] 프롬프트와 코드가 일치하는가?
- [ ] 테스트가 통과하는가?
- [ ] 문서가 업데이트되었는가?
- [ ] 환경변수가 문서화되었는가?

---

**문서 버전**: 1.0.0
**마지막 업데이트**: 2025-10-10
**작성자**: 개발팀
