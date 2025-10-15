# AI 에이전트 명세 (Agent Specification)

## 문서 목적
이 문서는 잔디-노션 웹훅 시스템에서 AI 에이전트(OpenAI GPT)의 역할, 동작 방식, 프롬프팅 전략을 정의합니다.

---

## 1. 에이전트 개요

### 1.1 역할
잔디 메신저에서 전송된 메시지를 **간결하고 명확하게 요약**하여 Notion에 저장 전 핵심 내용을 추출합니다.

### 1.2 사용 모델
```yaml
Provider: OpenAI
Model: gpt-3.5-turbo
Max Tokens: 150
Temperature: 0.3
```

**선택 이유:**
- `gpt-3.5-turbo`: 비용 효율적이면서도 한국어 요약에 충분한 성능
- `max_tokens: 150`: 1-2문장 요약에 적절한 길이 제한
- `temperature: 0.3`: 일관성 있는 요약을 위한 낮은 변동성

---

## 2. 프롬프트 구조

### 2.1 시스템 프롬프트
```
당신은 한국어 텍스트를 간결하게 요약하는 AI입니다.
핵심 내용을 1-2문장으로 요약해주세요.
```

**설계 원칙:**
- **단순성**: 복잡한 지시 없이 핵심 역할만 명시
- **명확성**: "1-2문장"이라는 구체적인 제약 설정
- **언어 고정**: "한국어"를 명시하여 언어 혼용 방지

### 2.2 사용자 프롬프트
```
다음 텍스트를 요약해주세요:

{사용자 메시지 전문}
```

**구조 설명:**
- 간단한 요청 문구
- 원문을 그대로 전달 (전처리 최소화)

---

## 3. Input/Output 명세

### 3.1 Input (원본 메시지)
```json
{
  "text": "오늘 프로젝트 회의에서 새로운 기능 개발에 대해 논의했습니다. 사용자 인터페이스 개선과 데이터베이스 최적화가 주요 안건이었고, 다음 주까지 프로토타입을 완성하기로 결정했습니다."
}
```

### 3.2 Output (AI 요약)
```json
{
  "summary": "프로젝트 회의에서 UI 개선과 DB 최적화를 논의하고, 다음 주까지 프로토타입 완성 결정."
}
```

**요약 품질 기준:**
- ✅ 핵심 내용 포함 (UI 개선, DB 최적화, 프로토타입 일정)
- ✅ 1-2문장으로 압축
- ✅ 명확한 한국어
- ❌ 불필요한 수식어 제거
- ❌ 중복 정보 제거

---

## 4. 에지 케이스 처리

### 4.1 짧은 텍스트 (10자 미만)
```javascript
if (!text || text.trim().length < 10) {
  return '요약할 내용이 너무 짧습니다.';
}
```

**예시:**
```
Input: "ㅇㅋ"
Output: "요약할 내용이 너무 짧습니다."
```

### 4.2 API 키 미설정
```javascript
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.log('⚠️ OpenAI API 키가 설정되지 않았습니다');
  return null;
}
```

**동작:**
- AI 요약 기능 비활성화
- `aiSummary: null`로 반환
- 서버는 정상 동작 (에러 발생 안 함)

### 4.3 API 에러
```javascript
catch (error) {
  console.error('❌ AI 요약 실패:', error.message);
  return '요약 생성에 실패했습니다.';
}
```

**에러 종류:**
- Rate Limit 초과
- 네트워크 타임아웃
- 잘못된 API 키
- 모델 사용 불가

**복구 전략:**
- 즉시 실패 반환 (재시도 안 함)
- 사용자에게 "요약 생성에 실패했습니다" 표시
- 어드민 페이지에서 수동 재시도 가능

---

## 5. 성능 최적화

### 5.1 응답 시간 목표
```
- 평균: 2-4초
- 최대: 10초
- 타임아웃: 30초
```

### 5.2 토큰 사용량 최적화
```javascript
// 입력 토큰 제한 (한국어는 ~1.5토큰/글자)
const MAX_INPUT_LENGTH = 500;  // 약 750토큰

if (text.length > MAX_INPUT_LENGTH) {
  text = text.substring(0, MAX_INPUT_LENGTH) + '...';
}
```

**비용 계산:**
- gpt-3.5-turbo: $0.0015/1K input tokens, $0.002/1K output tokens
- 평균 입력: 300토큰 (~$0.00045)
- 평균 출력: 50토큰 (~$0.0001)
- **건당 비용: ~$0.00055 (약 0.7원)**

---

## 6. 품질 보장

### 6.1 일관성 테스트
```typescript
// 같은 입력에 대해 5번 요약 실행
const text = "오늘 회의에서 프로젝트 일정과 예산을 논의했습니다.";

// 예상 결과 (유사한 의미여야 함)
[
  "회의에서 프로젝트 일정과 예산 논의.",
  "프로젝트 일정 및 예산에 대한 회의 진행.",
  "회의를 통해 일정과 예산 검토.",
  // ...
]
```

**허용 기준:**
- 핵심 키워드 포함 ("회의", "일정", "예산")
- 문장 길이 일관성
- 의미 왜곡 없음

### 6.2 품질 메트릭
```typescript
interface SummaryQuality {
  coherence: number;      // 일관성 (0-1)
  relevance: number;      // 관련성 (0-1)
  brevity: number;        // 간결성 (0-1)
  accuracy: number;       // 정확성 (0-1)
}

// 목표 점수
const TARGET_QUALITY = {
  coherence: 0.8,
  relevance: 0.9,
  brevity: 0.85,
  accuracy: 0.9
};
```

---

## 7. 재시도 정책

### 7.1 자동 재시도 (현재 미구현)
```javascript
// 추후 구현 예정
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;  // 1초

for (let i = 0; i < MAX_RETRIES; i++) {
  try {
    const summary = await summarizeText(text);
    if (summary && summary !== '요약 생성에 실패했습니다.') {
      return summary;
    }
  } catch (error) {
    if (i === MAX_RETRIES - 1) throw error;
    await sleep(RETRY_DELAY * (i + 1));  // 지수 백오프
  }
}
```

### 7.2 수동 재시도
어드민 페이지에서 "AI 요약 재생성" 버튼 클릭:
```http
POST /admin/retry-ai-summary
{
  "webhookId": "webhook_xxx"
}
```

---

## 8. 모니터링 및 로깅

### 8.1 로그 구조
```json
{
  "timestamp": "2025-10-10T00:22:06.200Z",
  "eventType": "ai_summary_generated",
  "webhookId": "webhook_xxx",
  "data": {
    "originalText": "원본 메시지...",
    "summary": "AI 요약 결과",
    "author": "홍길동",
    "room": "프로젝트팀"
  }
}
```

### 8.2 성능 모니터링
```javascript
// 추후 구현 예정
const startTime = Date.now();
const summary = await summarizeText(text);
const duration = Date.now() - startTime;

console.log(`🤖 AI 요약 완료 (${duration}ms)`);

// 성능 로그 저장
await savePerformanceLog({
  operation: 'ai_summary',
  duration: duration,
  inputLength: text.length,
  outputLength: summary.length
});
```

---

## 9. 보안 고려사항

### 9.1 민감 정보 필터링 (추후 구현)
```javascript
// 개인정보 마스킹
const maskSensitiveData = (text: string): string => {
  // 이메일 마스킹
  text = text.replace(/[\w-\.]+@([\w-]+\.)+[\w-]{2,4}/g, '***@***.***');

  // 전화번호 마스킹
  text = text.replace(/\d{3}-\d{4}-\d{4}/g, '***-****-****');

  // 주민등록번호 마스킹
  text = text.replace(/\d{6}-\d{7}/g, '******-*******');

  return text;
};
```

### 9.2 API 키 보호
```bash
# .env 파일
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# .gitignore에 추가
.env
```

---

## 10. 향후 개선 방향

### 10.1 모델 업그레이드
```yaml
Option 1:
  Model: gpt-4o-mini
  Benefit: 더 나은 한국어 이해도
  Cost: ~2배 증가

Option 2:
  Model: claude-3-haiku
  Benefit: 안정적인 요약 품질
  Cost: 유사

Option 3:
  Model: Custom Fine-tuned GPT-3.5
  Benefit: 도메인 특화 요약
  Cost: 초기 비용 발생
```

### 10.2 고급 기능
```typescript
// 다중 언어 지원
const detectLanguage = (text: string): 'ko' | 'en' | 'ja' => {
  // 언어 감지 로직
};

// 요약 스타일 선택
interface SummaryOptions {
  style: 'brief' | 'detailed' | 'bullet';
  maxSentences: number;
  includeKeywords: boolean;
}

// 키워드 추출
const extractKeywords = (text: string): string[] => {
  // NLP 기반 키워드 추출
};
```

### 10.3 캐싱 전략
```javascript
// Redis 기반 캐싱 (추후 구현)
const getCachedSummary = async (textHash: string) => {
  return await redis.get(`summary:${textHash}`);
};

const cacheSummary = async (textHash: string, summary: string) => {
  await redis.set(`summary:${textHash}`, summary, 'EX', 3600);  // 1시간
};
```

---

## 11. 테스트 케이스

### 11.1 정상 케이스
```javascript
describe('AI Summarization', () => {
  it('should summarize long text', async () => {
    const input = "오늘 회의에서 새로운 프로젝트에 대해 논의했습니다. " +
                  "주요 안건은 UI 개선과 데이터베이스 최적화였습니다.";
    const output = await summarizeText(input);

    expect(output).toBeDefined();
    expect(output.length).toBeLessThan(input.length);
    expect(output).toContain('회의');
  });
});
```

### 11.2 에지 케이스
```javascript
it('should handle short text', async () => {
  const output = await summarizeText("ㅇㅋ");
  expect(output).toBe('요약할 내용이 너무 짧습니다.');
});

it('should handle empty text', async () => {
  const output = await summarizeText("");
  expect(output).toBe('요약할 내용이 너무 짧습니다.');
});

it('should handle API error gracefully', async () => {
  // API 키를 잘못된 값으로 설정
  process.env.OPENAI_API_KEY = 'invalid_key';
  const output = await summarizeText("테스트");
  expect(output).toBe('요약 생성에 실패했습니다.');
});
```

---

## 12. FAQ

### Q1: AI 요약이 너무 길거나 짧습니다
**A**: `max_tokens` 값을 조정하거나 시스템 프롬프트에 문장 수 제약을 더 명확히 합니다.

### Q2: 요약 품질이 일관적이지 않습니다
**A**: `temperature`를 더 낮춰보세요 (현재 0.3 → 0.1). 단, 너무 낮으면 반복적인 표현이 나올 수 있습니다.

### Q3: 특정 도메인 용어가 잘못 요약됩니다
**A**: 시스템 프롬프트에 도메인 컨텍스트를 추가하거나, Fine-tuning을 고려하세요.

---

## 13. 참고 자료

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Best Practices for Prompt Engineering](https://platform.openai.com/docs/guides/prompt-engineering)
- [GPT-3.5 Turbo Pricing](https://openai.com/pricing)

---

**문서 버전**: 1.0.0
**마지막 업데이트**: 2025-10-10
