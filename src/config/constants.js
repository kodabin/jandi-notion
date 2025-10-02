// 웹훅 처리 단계 정의
const WEBHOOK_STEPS = {
    RECEIVED: 'received',
    AI_SUMMARY_START: 'ai_summary_start',
    AI_SUMMARY_COMPLETE: 'ai_summary_complete',
    NOTION_SAVE_START: 'notion_save_start',
    NOTION_SAVE_COMPLETE: 'notion_save_complete',
    COMPLETED: 'completed',
    ERROR: 'error'
};

// 로그 관련 상수
const LOG_CONFIG = {
    MAX_LOGS: 100,
    WEBHOOK_RETENTION_TIME: 300000 // 5분 (밀리초)
};

// AI 요약 설정
const AI_CONFIG = {
    MODEL: "gpt-3.5-turbo",
    MAX_TOKENS: 150,
    TEMPERATURE: 0.3,
    MIN_TEXT_LENGTH: 10
};

module.exports = {
    WEBHOOK_STEPS,
    LOG_CONFIG,
    AI_CONFIG
};
