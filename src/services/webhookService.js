const { WEBHOOK_STEPS } = require('../config/constants');
const { updateWebhookStatus, getWebhookStatus } = require('../utils/webhookTracker');
const { saveLog, getLogs } = require('../utils/logger');
const { summarizeText } = require('./aiService');

/**
 * AI 요약 재생성 함수 (특정 웹훅용)
 * @param {string} webhookId - 웹훅 ID
 * @param {string} text - 요약할 텍스트
 * @returns {Promise<string>} - 요약된 텍스트
 */
async function retrySummarizeText(webhookId, text) {
    // 실행 중인 웹훅인지 확인
    const webhook = getWebhookStatus(webhookId);

    if (!webhook) {
        // 로그에서 웹훅 데이터 찾기
        try {
            const logs = await getLogs();
            const webhookLog = logs.find(log =>
                log.webhookId === webhookId &&
                log.eventType === 'webhook_received'
            );

            if (!webhookLog) {
                throw new Error('웹훅 데이터를 찾을 수 없습니다');
            }

            // 새로운 처리 상태 생성
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_START, {
                text: webhookLog.data.text,
                userName: webhookLog.data.userName,
                roomName: webhookLog.data.roomName,
                teamName: webhookLog.data.teamName,
                createdAt: webhookLog.data.createdAt,
                isRetry: true
            });
        } catch (error) {
            throw new Error('웹훅 데이터를 찾을 수 없습니다: ' + error.message);
        }
    }

    try {
        const summary = await summarizeText(text);

        if (summary) {
            // AI 요약 완료 상태 업데이트
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_COMPLETE, {
                aiSummary: summary,
                isRetry: true
            });

            // 재생성 로그 저장
            await saveLog({
                originalText: text,
                summary: summary,
                author: webhook?.data?.userName || '알 수 없음',
                room: webhook?.data?.roomName || '알 수 없음',
                retryTimestamp: new Date().toISOString()
            }, 'ai_summary_regenerated', webhookId);

            return summary;
        } else {
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
                error: 'AI 요약 재생성 실패'
            });
            throw new Error('AI 요약 생성 실패');
        }
    } catch (error) {
        updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
            error: error.message
        });
        throw error;
    }
}

/**
 * 웹훅 데이터 처리 (메인 로직)
 * @param {Object} webhookData - 웹훅 데이터
 * @param {string} webhookId - 웹훅 ID
 * @returns {Promise<Object>} - 처리 결과
 */
async function processWebhook(webhookData, webhookId) {
    const webhookReceiveTime = new Date().toISOString();

    // 1단계: 웹훅 수신 - 상태 추적 시작
    updateWebhookStatus(webhookId, WEBHOOK_STEPS.RECEIVED, {
        text: webhookData.text,
        userName: webhookData.userName,
        roomName: webhookData.roomName,
        teamName: webhookData.teamName,
        createdAt: webhookData.createdAt
    });

    await saveLog(webhookData, 'webhook_received', webhookId);

    // 웹훅이 이미 처리 중인지 확인 (중복 방지)
    const existingWebhook = getWebhookStatus(webhookId);
    if (existingWebhook && existingWebhook.currentStep !== WEBHOOK_STEPS.RECEIVED) {
        console.log('⚠️ 이미 처리 중인 웹훅입니다:', webhookId);
        return {
            success: false,
            error: '이미 처리 중인 웹훅입니다',
            currentStep: existingWebhook.currentStep
        };
    }

    // AI 요약 생성
    let aiSummary = null;
    if (webhookData.text) {
        // 2단계: AI 요약 시작
        updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_START);
        console.log('🤖 AI 요약 생성 중...');

        aiSummary = await summarizeText(webhookData.text);

        if (aiSummary) {
            // 3단계: AI 요약 완료
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_COMPLETE, {
                aiSummary: aiSummary
            });
            console.log('✅ AI 요약 완료:', aiSummary);

            // AI 요약 로그 저장
            await saveLog({
                originalText: webhookData.text,
                summary: aiSummary,
                author: webhookData.userName,
                room: webhookData.roomName
            }, 'ai_summary_generated', webhookId);
        } else {
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
                error: 'AI 요약 생성 실패'
            });
        }
    }

    // 최종 단계: 처리 완료
    updateWebhookStatus(webhookId, WEBHOOK_STEPS.COMPLETED);
    console.log('📝 잔디 웹훅 데이터를 로컬에만 저장합니다');

    await saveLog({
        message: '잔디 웹훅 수신 완료 (노션 연동 비활성화됨)',
        data: webhookData,
        aiSummary: aiSummary
    }, 'webhook_processed', webhookId);

    return {
        success: true,
        message: '잔디 웹훅 데이터를 성공적으로 수신했습니다',
        webhookId: webhookId,
        data: webhookData,
        aiSummary: aiSummary,
        timing: {
            webhookReceived: webhookReceiveTime
        }
    };
}

module.exports = {
    processWebhook,
    retrySummarizeText
};
