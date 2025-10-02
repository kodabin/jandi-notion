const { WEBHOOK_STEPS, LOG_CONFIG } = require('../config/constants');

// 실행 중인 작업 추적용 (웹훅 ID별로 상태 관리)
const processingWebhooks = new Map();

/**
 * 웹훅 처리 상태 업데이트 함수
 * @param {string} webhookId - 웹훅 ID
 * @param {string} step - 처리 단계
 * @param {Object} data - 추가 데이터
 */
function updateWebhookStatus(webhookId, step, data = {}) {
    if (!processingWebhooks.has(webhookId)) {
        processingWebhooks.set(webhookId, {
            id: webhookId,
            startTime: new Date().toISOString(),
            currentStep: step,
            steps: [],
            data: {}
        });
    }

    const webhook = processingWebhooks.get(webhookId);
    webhook.currentStep = step;
    webhook.steps.push({
        step,
        timestamp: new Date().toISOString(),
        data
    });
    webhook.data = { ...webhook.data, ...data };

    // 완료되거나 에러인 경우 일정 시간 후 제거
    if (step === WEBHOOK_STEPS.COMPLETED || step === WEBHOOK_STEPS.ERROR) {
        setTimeout(() => {
            processingWebhooks.delete(webhookId);
        }, LOG_CONFIG.WEBHOOK_RETENTION_TIME);
    }
}

/**
 * 웹훅 ID 생성
 * @returns {string} - 고유한 웹훅 ID
 */
function generateWebhookId() {
    return `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 웹훅 상태 조회
 * @param {string} webhookId - 웹훅 ID
 * @returns {Object|undefined} - 웹훅 상태
 */
function getWebhookStatus(webhookId) {
    return processingWebhooks.get(webhookId);
}

/**
 * 모든 처리 중인 웹훅 조회
 * @returns {Array} - 처리 중인 웹훅 배열
 */
function getProcessingWebhooks() {
    return Array.from(processingWebhooks.values()).filter(webhook =>
        webhook.currentStep !== WEBHOOK_STEPS.COMPLETED &&
        webhook.currentStep !== WEBHOOK_STEPS.ERROR
    );
}

module.exports = {
    updateWebhookStatus,
    generateWebhookId,
    getWebhookStatus,
    getProcessingWebhooks,
    processingWebhooks
};
