// API 설정
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : '';

// 메시지 색상 옵션
export const MESSAGE_COLORS = [
  { value: '#FAC11B', label: '노란색 (기본)' },
  { value: '#36a64f', label: '초록색' },
  { value: '#ff0000', label: '빨간색' },
  { value: '#0000ff', label: '파란색' },
  { value: '#800080', label: '보라색' }
];

// 웹훅 단계 이름 매핑
export const STEP_NAMES: { [key: string]: string } = {
  'received': '수신됨',
  'ai_summary_start': 'AI 요약 시작',
  'ai_summary_complete': 'AI 요약 완료',
  'notion_save_start': '노션 저장 시작',
  'notion_save_complete': '노션 저장 완료',
  'completed': '처리 완료',
  'error': '오류 발생'
};

// 웹훅 처리 단계 순서
export const STEP_ORDER = [
  'received',
  'ai_summary_start',
  'ai_summary_complete',
  'notion_save_start',
  'notion_save_complete',
  'completed'
];

// 자동 새로고침 간격 (밀리초)
export const AUTO_REFRESH_INTERVAL = {
  MAIN_PAGE: 2000,
  ADMIN_PAGE: 3000
};
