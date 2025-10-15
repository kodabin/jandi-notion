# 어드민 대시보드 - 싱글톤 프롬프트

## 메타 정보
- **버전**: 1.0.0
- **생성일**: 2025-10-10
- **멱등성**: 이 프롬프트는 항상 동일한 어드민 시스템을 생성합니다
- **의존성**: SYSTEM_PROMPT.md의 백엔드 API를 기반으로 동작

---

## 1. 어드민 대시보드 개요

### 1.1 목적
잔디 웹훅 처리 과정을 실시간으로 모니터링하고, 필요 시 특정 단계를 재시도할 수 있는 관리자 도구

### 1.2 핵심 기능
- **실시간 모니터링**: 처리 중인 웹훅의 현재 상태 표시
- **이력 조회**: 최근 완료된 웹훅 목록 (최대 10개)
- **단계 시각화**: 각 웹훅의 처리 단계를 시간순으로 표시
- **재시도 기능**: AI 요약 단계 재실행

---

## 2. UI/UX 명세

### 2.1 레이아웃 구조
```
┌─────────────────────────────────────────────────────────┐
│  Admin Dashboard - 잔디 웹훅 모니터링                     │
├─────────────────────────────────────────────────────────┤
│  [자동 새로고침: ON]  마지막 업데이트: 2025-10-10 09:00  │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │  처리 중 (0)        │  │  최근 완료 (10)     │      │
│  ├─────────────────────┤  ├─────────────────────┤      │
│  │                     │  │  [웹훅 카드 1]      │      │
│  │  현재 처리 중인     │  │  [웹훅 카드 2]      │      │
│  │  웹훅이 없습니다    │  │  [웹훅 카드 3]      │      │
│  │                     │  │  ...                │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 웹훅 카드 디자인
```
┌───────────────────────────────────────────────────────────┐
│ 📨 webhook_1760055724519_u0pi4o22d                        │
│ 상태: ✅ 완료   |   시작: 2025-10-10 00:22:04              │
├───────────────────────────────────────────────────────────┤
│ 메시지: "/서버 테스트"                                     │
│ 작성자: 고다빈  |  대화방: test  |  팀: 님버스테크(주)     │
├───────────────────────────────────────────────────────────┤
│ 처리 단계:                                                 │
│   ✅ [00:22:04] 웹훅 수신                                 │
│   ✅ [00:22:04] AI 요약 시작                              │
│   ✅ [00:22:06] AI 요약 완료                              │
│      → "핵심 내용을 1-2문장으로 요약..."                   │
│   ✅ [00:22:07] 처리 완료                                 │
├───────────────────────────────────────────────────────────┤
│ [🔄 AI 요약 재생성]  [📋 상세 로그 보기]                  │
└───────────────────────────────────────────────────────────┘
```

### 2.3 단계별 상태 아이콘 및 색상
```javascript
const STEP_STATUS = {
  completed: {
    icon: '✅',
    color: '#22c55e',  // 녹색
    bgColor: '#dcfce7'
  },
  in_progress: {
    icon: '🔄',
    color: '#3b82f6',  // 파란색
    bgColor: '#dbeafe'
  },
  pending: {
    icon: '⏳',
    color: '#94a3b8',  // 회색
    bgColor: '#f1f5f9'
  },
  error: {
    icon: '❌',
    color: '#ef4444',  // 빨간색
    bgColor: '#fee2e2'
  }
};
```

---

## 3. 데이터 페칭 명세

### 3.1 폴링 방식
```typescript
// 5초마다 자동 새로고침
useEffect(() => {
  const interval = setInterval(() => {
    fetchWebhooks();
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

### 3.2 API 호출 구조
```typescript
interface FetchWebhooksResponse {
  processing: WebhookState[];  // 처리 중인 웹훅들
  recent: WebhookState[];      // 최근 완료된 웹훅들 (최대 10개)
}

interface WebhookState {
  id: string;
  startTime: string;  // ISO 8601 format
  currentStep: 'received' | 'ai_summary_start' | 'ai_summary_complete' |
               'notion_save_start' | 'notion_save_complete' | 'completed' | 'error';
  steps: Array<{
    step: string;
    timestamp: string;
    data: Record<string, any>;
  }>;
  data: {
    text: string;
    userName: string;
    roomName: string;
    teamName: string;
    aiSummary?: string;
    error?: string;
  };
}
```

---

## 4. 컴포넌트 명세

### 4.1 AdminPage (메인 컴포넌트)
```typescript
// AdminPage.tsx
const AdminPage: React.FC = () => {
  const [processing, setProcessing] = useState<WebhookState[]>([]);
  const [recent, setRecent] = useState<WebhookState[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 웹훅 데이터 페칭
  const fetchWebhooks = async () => {
    const response = await fetch('/admin/webhooks');
    const data = await response.json();
    setProcessing(data.processing);
    setRecent(data.recent);
    setLastUpdate(new Date());
  };

  // 자동 새로고침
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchWebhooks, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // 초기 로드
  useEffect(() => {
    fetchWebhooks();
  }, []);

  return (
    <div className="admin-page">
      <Header
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        lastUpdate={lastUpdate}
      />
      <div className="content">
        <Section title="처리 중" count={processing.length}>
          {processing.map(webhook => (
            <WebhookCard key={webhook.id} webhook={webhook} />
          ))}
        </Section>
        <Section title="최근 완료" count={recent.length}>
          {recent.map(webhook => (
            <WebhookCard key={webhook.id} webhook={webhook} />
          ))}
        </Section>
      </div>
    </div>
  );
};
```

### 4.2 WebhookCard 컴포넌트
```typescript
interface WebhookCardProps {
  webhook: WebhookState;
}

const WebhookCard: React.FC<WebhookCardProps> = ({ webhook }) => {
  const [retrying, setRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRetryAiSummary = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/admin/retry-ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: webhook.id })
      });
      const result = await response.json();

      if (result.success) {
        alert(`✅ AI 요약이 재생성되었습니다:\n${result.newSummary}`);
      } else {
        alert(`❌ 재생성 실패: ${result.error}`);
      }
    } catch (error: any) {
      alert(`❌ 에러: ${error.message}`);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={`webhook-card webhook-card--${webhook.currentStep}`}>
      {/* 헤더 */}
      <div className="webhook-card__header">
        <div className="webhook-card__id">
          📨 {webhook.id}
        </div>
        <div className="webhook-card__meta">
          {getStatusBadge(webhook.currentStep)} | 시작: {formatTime(webhook.startTime)}
        </div>
      </div>

      {/* 본문 */}
      <div className="webhook-card__body">
        <div className="webhook-card__message">
          메시지: "{truncate(webhook.data.text, 50)}"
        </div>
        <div className="webhook-card__info">
          작성자: {webhook.data.userName} | 대화방: {webhook.data.roomName} | 팀: {webhook.data.teamName}
        </div>
      </div>

      {/* 처리 단계 */}
      <div className="webhook-card__steps">
        <div className="webhook-card__steps-title">처리 단계:</div>
        {webhook.steps.map((step, index) => (
          <StepItem key={index} step={step} />
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="webhook-card__actions">
        <button
          onClick={handleRetryAiSummary}
          disabled={retrying || webhook.currentStep === 'processing'}
          className="btn btn-retry"
        >
          {retrying ? '⏳ 재생성 중...' : '🔄 AI 요약 재생성'}
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="btn btn-details"
        >
          📋 {showDetails ? '닫기' : '상세 로그 보기'}
        </button>
      </div>

      {/* 상세 로그 */}
      {showDetails && (
        <div className="webhook-card__details">
          <pre>{JSON.stringify(webhook, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

### 4.3 StepItem 컴포넌트
```typescript
interface StepItemProps {
  step: {
    step: string;
    timestamp: string;
    data: Record<string, any>;
  };
}

const StepItem: React.FC<StepItemProps> = ({ step }) => {
  const status = getStepStatus(step.step);
  const icon = STEP_STATUS[status].icon;
  const color = STEP_STATUS[status].color;

  return (
    <div className="step-item" style={{ color }}>
      <span className="step-item__icon">{icon}</span>
      <span className="step-item__time">[{formatTime(step.timestamp)}]</span>
      <span className="step-item__name">{getStepName(step.step)}</span>
      {step.data.aiSummary && (
        <div className="step-item__summary">
          → "{truncate(step.data.aiSummary, 80)}"
        </div>
      )}
      {step.data.error && (
        <div className="step-item__error">
          ❌ {step.data.error}
        </div>
      )}
    </div>
  );
};
```

### 4.4 유틸리티 함수
```typescript
// 시간 포맷팅 (HH:MM:SS)
const formatTime = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// 텍스트 자르기
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 상태 배지 생성
const getStatusBadge = (currentStep: string): string => {
  const badges: Record<string, string> = {
    'received': '⏳ 수신됨',
    'ai_summary_start': '🔄 AI 처리 중',
    'ai_summary_complete': '✅ AI 완료',
    'notion_save_start': '🔄 Notion 저장 중',
    'notion_save_complete': '✅ Notion 완료',
    'completed': '✅ 완료',
    'error': '❌ 에러'
  };
  return badges[currentStep] || '❓ 알 수 없음';
};

// 단계명 한글화
const getStepName = (step: string): string => {
  const names: Record<string, string> = {
    'received': '웹훅 수신',
    'ai_summary_start': 'AI 요약 시작',
    'ai_summary_complete': 'AI 요약 완료',
    'notion_save_start': 'Notion 저장 시작',
    'notion_save_complete': 'Notion 저장 완료',
    'completed': '처리 완료',
    'error': '에러 발생'
  };
  return names[step] || step;
};

// 단계 상태 판단
const getStepStatus = (stepName: string): 'completed' | 'in_progress' | 'pending' | 'error' => {
  if (stepName === 'error') return 'error';
  if (stepName.includes('start')) return 'in_progress';
  return 'completed';
};
```

---

## 5. CSS 스타일 명세

### 5.1 전역 스타일
```css
/* AdminPage.css */
.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.admin-page__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.admin-page__title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.admin-page__controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.admin-page__content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 30px;
}

@media (max-width: 1024px) {
  .admin-page__content {
    grid-template-columns: 1fr;
  }
}
```

### 5.2 웹훅 카드 스타일
```css
.webhook-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.webhook-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* 상태별 보더 색상 */
.webhook-card--completed {
  border-left: 4px solid #22c55e;
}

.webhook-card--error {
  border-left: 4px solid #ef4444;
}

.webhook-card--processing {
  border-left: 4px solid #3b82f6;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.webhook-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
}

.webhook-card__id {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #6b7280;
}

.webhook-card__meta {
  font-size: 13px;
  color: #9ca3af;
}

.webhook-card__body {
  margin-bottom: 15px;
}

.webhook-card__message {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #1f2937;
}

.webhook-card__info {
  font-size: 13px;
  color: #6b7280;
}

.webhook-card__steps {
  background: #f9fafb;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.webhook-card__steps-title {
  font-weight: 600;
  margin-bottom: 10px;
  color: #374151;
}

.webhook-card__actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-retry {
  background: #3b82f6;
  color: white;
}

.btn-retry:hover:not(:disabled) {
  background: #2563eb;
}

.btn-details {
  background: #6b7280;
  color: white;
}

.btn-details:hover {
  background: #4b5563;
}

.webhook-card__details {
  background: #1f2937;
  color: #e5e7eb;
  border-radius: 6px;
  padding: 15px;
  margin-top: 15px;
  overflow-x: auto;
}

.webhook-card__details pre {
  margin: 0;
  font-size: 12px;
  font-family: 'Courier New', monospace;
}
```

### 5.3 단계 아이템 스타일
```css
.step-item {
  padding: 8px 0;
  font-size: 14px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.step-item__icon {
  flex-shrink: 0;
}

.step-item__time {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #6b7280;
  flex-shrink: 0;
}

.step-item__name {
  font-weight: 500;
}

.step-item__summary {
  margin-top: 5px;
  padding-left: 28px;
  font-size: 13px;
  color: #059669;
  font-style: italic;
}

.step-item__error {
  margin-top: 5px;
  padding-left: 28px;
  font-size: 13px;
  color: #dc2626;
  font-weight: 500;
}
```

### 5.4 섹션 스타일
```css
.section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e5e7eb;
}

.section__title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.section__count {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.section__empty {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
  font-size: 15px;
}
```

---

## 6. 재시도 기능 상세 명세

### 6.1 재시도 버튼 활성화 조건
```typescript
const canRetryAiSummary = (webhook: WebhookState): boolean => {
  // 에러 상태이거나 완료된 경우만 재시도 가능
  if (webhook.currentStep === 'error' || webhook.currentStep === 'completed') {
    return true;
  }

  // 처리 중인 경우 재시도 불가
  if (webhook.currentStep.includes('start') || webhook.currentStep === 'received') {
    return false;
  }

  return true;
};
```

### 6.2 재시도 플로우
```
사용자 클릭
    ↓
[확인] 버튼 비활성화 + "⏳ 재생성 중..." 표시
    ↓
POST /admin/retry-ai-summary { webhookId }
    ↓
성공 → alert("✅ AI 요약이 재생성되었습니다")
실패 → alert("❌ 재생성 실패: {에러 메시지}")
    ↓
[확인] 버튼 활성화
    ↓
자동 새로고침으로 새 데이터 반영
```

### 6.3 사용자 피드백
```typescript
// 성공 알림
alert(`✅ AI 요약이 재생성되었습니다:\n\n${result.newSummary}`);

// 실패 알림 (409 Conflict)
alert(`❌ 재생성 실패: 해당 웹훅이 아직 처리 중입니다`);

// 실패 알림 (404 Not Found)
alert(`❌ 재생성 실패: 웹훅 데이터를 찾을 수 없거나 텍스트가 없습니다`);

// 네트워크 에러
alert(`❌ 에러: 서버와 통신할 수 없습니다`);
```

---

## 7. 에러 처리

### 7.1 API 에러 처리
```typescript
const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
};

// 사용 예시
try {
  const response = await fetch('/admin/webhooks');
  const data = await handleApiError(response);
  setProcessing(data.processing);
  setRecent(data.recent);
} catch (error: any) {
  console.error('웹훅 조회 실패:', error);
  // 사용자에게 에러 표시 (토스트 또는 알림)
}
```

### 7.2 네트워크 타임아웃
```typescript
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('요청 시간 초과 (10초)');
    }
    throw error;
  }
};
```

---

## 8. 성능 최적화

### 8.1 불필요한 리렌더링 방지
```typescript
// React.memo로 컴포넌트 메모이제이션
const WebhookCard = React.memo<WebhookCardProps>(({ webhook }) => {
  // ...
}, (prevProps, nextProps) => {
  // webhook.id가 같고 currentStep이 같으면 리렌더링 안 함
  return prevProps.webhook.id === nextProps.webhook.id &&
         prevProps.webhook.currentStep === nextProps.webhook.currentStep;
});
```

### 8.2 대량 데이터 처리
```typescript
// 최근 완료 목록은 최대 10개만 표시
const MAX_RECENT_WEBHOOKS = 10;

// 서버에서 이미 10개로 제한되지만, 클라이언트에서도 안전하게 처리
const displayedRecent = recent.slice(0, MAX_RECENT_WEBHOOKS);
```

---

## 9. 접근성 (Accessibility)

### 9.1 키보드 네비게이션
```tsx
<button
  onClick={handleRetryAiSummary}
  onKeyPress={(e) => e.key === 'Enter' && handleRetryAiSummary()}
  aria-label="AI 요약 재생성"
  disabled={retrying}
>
  {retrying ? '⏳ 재생성 중...' : '🔄 AI 요약 재생성'}
</button>
```

### 9.2 스크린 리더 지원
```tsx
<div role="region" aria-label="웹훅 처리 단계">
  {webhook.steps.map((step, index) => (
    <div key={index} role="listitem" aria-label={`${getStepName(step.step)}, ${formatTime(step.timestamp)}`}>
      <StepItem step={step} />
    </div>
  ))}
</div>
```

---

## 10. 테스트 시나리오

### 10.1 수동 테스트 체크리스트
```
□ 페이지 로드 시 웹훅 목록이 표시되는가?
□ 5초마다 자동 새로고침이 동작하는가?
□ 자동 새로고침 토글이 작동하는가?
□ 웹훅 카드에 모든 정보가 올바르게 표시되는가?
□ 단계별 아이콘과 색상이 올바르게 표시되는가?
□ AI 요약 재생성 버튼이 작동하는가?
□ 재생성 중 버튼이 비활성화되는가?
□ 재생성 성공 시 알림이 표시되는가?
□ 재생성 실패 시 에러 메시지가 표시되는가?
□ 상세 로그 보기/닫기가 작동하는가?
□ 반응형 레이아웃이 모바일에서 정상 동작하는가?
```

### 10.2 자동화 테스트 (추후 구현)
```typescript
// 예시: Jest + React Testing Library
describe('AdminPage', () => {
  it('should fetch and display webhooks on mount', async () => {
    render(<AdminPage />);
    await waitFor(() => {
      expect(screen.getByText(/처리 중/)).toBeInTheDocument();
    });
  });

  it('should retry AI summary when button clicked', async () => {
    render(<AdminPage />);
    const retryButton = screen.getByText(/AI 요약 재생성/);
    fireEvent.click(retryButton);
    await waitFor(() => {
      expect(screen.getByText(/재생성 중/)).toBeInTheDocument();
    });
  });
});
```

---

## 11. 배포 및 빌드

### 11.1 프론트엔드 빌드
```bash
# 개발 모드
cd frontend
npm start

# 프로덕션 빌드
cd frontend
npm run build
cd ..

# 빌드 결과물은 frontend/build에 생성됨
# Express 서버가 이를 정적 파일로 제공
```

### 11.2 환경별 설정
```typescript
// config.ts
const config = {
  development: {
    apiBaseUrl: 'http://localhost:3000',
    refreshInterval: 5000
  },
  production: {
    apiBaseUrl: process.env.REACT_APP_API_URL || '',
    refreshInterval: 10000
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## 12. 알려진 제약사항

### 12.1 현재 구현된 기능
- ✅ 실시간 폴링 (5초 간격)
- ✅ 웹훅 목록 조회
- ✅ 단계별 시각화
- ✅ AI 요약 재생성

### 12.2 미구현 기능 (추후 개선)
- ❌ WebSocket 기반 실시간 업데이트
- ❌ 날짜별 필터링
- ❌ 검색 기능
- ❌ 페이지네이션
- ❌ 사용자 인증
- ❌ 웹훅 삭제 기능
- ❌ 통계 및 차트

---

## 13. 향후 개선 방향

### 13.1 고급 기능
```typescript
// 날짜 필터링
interface FilterOptions {
  dateFrom?: string;  // ISO 8601
  dateTo?: string;
  status?: 'completed' | 'error' | 'processing';
  roomName?: string;
  userName?: string;
}

// 검색
const searchWebhooks = (query: string, webhooks: WebhookState[]) => {
  return webhooks.filter(w =>
    w.data.text.includes(query) ||
    w.data.userName.includes(query) ||
    w.data.roomName.includes(query)
  );
};

// 통계
interface WebhookStats {
  totalProcessed: number;
  totalErrors: number;
  averageProcessingTime: number;  // ms
  successRate: number;  // 0-100
}
```

### 13.2 UI 개선
- 다크 모드 지원
- 커스텀 테마
- 드래그 앤 드롭으로 카드 정렬
- 애니메이션 효과

### 13.3 알림 기능
- 에러 발생 시 브라우저 알림
- 이메일 알림 (서버 사이드)
- Slack/Discord 연동

---

## 14. FAQ

### Q1: 웹훅이 표시되지 않습니다
**A**:
1. 서버가 실행 중인지 확인 (`http://localhost:3000`)
2. `/admin/webhooks` API가 정상 응답하는지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### Q2: 자동 새로고침이 작동하지 않습니다
**A**:
1. 자동 새로고침 토글이 ON인지 확인
2. 브라우저 개발자 도구 → Network 탭에서 5초마다 요청이 가는지 확인

### Q3: AI 요약 재생성이 실패합니다
**A**:
1. `.env` 파일의 `OPENAI_API_KEY`가 올바른지 확인
2. 서버 로그에서 상세 에러 메시지 확인
3. 웹훅이 아직 처리 중이 아닌지 확인

---

## 15. 변경 이력

### v1.0.0 (2025-10-10)
- 초기 싱글톤 프롬프트 작성
- React + TypeScript 기반
- 실시간 폴링 방식
- AI 요약 재생성 기능

---

**문서 종료**
