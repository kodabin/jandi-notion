const express = require('express');
const { getProcessingWebhooks } = require('../utils/webhookTracker');
const { getLogs } = require('../utils/logger');
const { retrySummarizeText } = require('../services/webhookService');
const { WEBHOOK_STEPS } = require('../config/constants');

const router = express.Router();

/**
 * 웹훅 상태 조회 엔드포인트
 */
router.get('/webhooks', async (req, res) => {
    try {
        // 현재 처리 중인 웹훅들
        const processing = getProcessingWebhooks();

        // 최근 처리된 웹훅들 (로그에서)
        let recent = [];
        try {
            const logs = await getLogs();

            // 완료된 웹훅들의 최종 상태 찾기
            const completedWebhooks = logs
                .filter(log =>
                    log.webhookId &&
                    (log.eventType === 'webhook_processed' || log.eventType === 'webhook_error')
                )
                .slice(-10) // 최근 10개만
                .map(log => {
                    // 해당 웹훅의 모든 단계 정보 수집
                    const webhookLogs = logs.filter(l => l.webhookId === log.webhookId);
                    const steps = [];

                    // 각 단계별 로그 찾기
                    const receivedLog = webhookLogs.find(l => l.eventType === 'webhook_received');
                    if (receivedLog) {
                        steps.push({
                            step: WEBHOOK_STEPS.RECEIVED,
                            timestamp: receivedLog.timestamp,
                            data: receivedLog.data
                        });
                    }

                    const aiSummaryLog = webhookLogs.find(l =>
                        l.eventType === 'ai_summary_generated' ||
                        l.eventType === 'ai_summary_regenerated'
                    );
                    if (aiSummaryLog) {
                        steps.push({
                            step: WEBHOOK_STEPS.AI_SUMMARY_START,
                            timestamp: aiSummaryLog.timestamp,
                            data: {}
                        });
                        steps.push({
                            step: WEBHOOK_STEPS.AI_SUMMARY_COMPLETE,
                            timestamp: aiSummaryLog.timestamp,
                            data: { aiSummary: aiSummaryLog.data.summary }
                        });
                    }

                    return {
                        id: log.webhookId,
                        startTime: receivedLog?.timestamp || log.timestamp,
                        currentStep: log.eventType === 'webhook_error' ?
                            WEBHOOK_STEPS.ERROR : WEBHOOK_STEPS.COMPLETED,
                        steps: steps,
                        data: {
                            text: receivedLog?.data?.text || '',
                            userName: receivedLog?.data?.userName || '알 수 없음',
                            roomName: receivedLog?.data?.roomName || '알 수 없음',
                            teamName: receivedLog?.data?.teamName || '알 수 없음',
                            aiSummary: aiSummaryLog?.data?.summary || null
                        }
                    };
                });

            recent = completedWebhooks;
        } catch (error) {
            console.error('로그 읽기 오류:', error);
        }

        res.json({
            processing,
            recent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * AI 요약 재생성 엔드포인트
 */
router.post('/retry-ai-summary', async (req, res) => {
    const { webhookId } = req.body;

    if (!webhookId) {
        return res.status(400).json({
            success: false,
            error: 'webhookId가 필요합니다'
        });
    }

    try {
        // 로그에서 원본 텍스트 찾기
        const logs = await getLogs();
        const webhookLog = logs.find(log =>
            log.webhookId === webhookId &&
            log.eventType === 'webhook_received'
        );

        if (!webhookLog || !webhookLog.data.text) {
            return res.status(404).json({
                success: false,
                error: '웹훅 데이터를 찾을 수 없거나 텍스트가 없습니다'
            });
        }

        console.log('🔄 AI 요약 재생성 시작:', webhookId);

        // AI 요약 재생성 실행
        const newSummary = await retrySummarizeText(webhookId, webhookLog.data.text);

        res.json({
            success: true,
            message: 'AI 요약이 성공적으로 재생성되었습니다',
            webhookId,
            newSummary,
            originalText: webhookLog.data.text
        });

    } catch (error) {
        console.error('❌ AI 요약 재생성 실패:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
