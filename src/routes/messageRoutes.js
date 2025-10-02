const express = require('express');
const { sendMessageToJandi } = require('../services/jandiService');
const { summarizeText } = require('../services/aiService');
const { saveLog } = require('../utils/logger');

const router = express.Router();

/**
 * 잔디로 메시지 보내기 엔드포인트
 */
router.post('/send-to-jandi', async (req, res) => {
    const { body, connectColor, connectInfo } = req.body;

    console.log('📤 잔디로 메시지 전송 시도');

    try {
        const result = await sendMessageToJandi({ body, connectColor, connectInfo });

        console.log('✅ 잔디 메시지 전송 성공');

        // 로그 저장
        await saveLog({
            message: '잔디로 메시지 전송 완료',
            sentData: result.sentData,
            response: result.status
        }, 'jandi_message_sent');

        res.json({
            success: true,
            message: '잔디로 메시지가 성공적으로 전송되었습니다',
            sentData: result.sentData
        });

    } catch (error) {
        console.error('❌ 잔디 메시지 전송 실패:', error.message);

        await saveLog({
            message: '잔디 메시지 전송 실패',
            error: error.message,
            requestData: req.body
        }, 'jandi_message_failed');

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * AI 요약 테스트 엔드포인트
 */
router.post('/test-ai-summary', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({
            success: false,
            error: '요약할 텍스트를 제공해주세요'
        });
    }

    console.log('🧪 AI 요약 테스트 실행');

    try {
        const summary = await summarizeText(text);

        if (summary) {
            await saveLog({
                originalText: text,
                summary: summary,
                author: 'AI 테스트',
                room: '테스트'
            }, 'ai_summary_generated');

            res.json({
                success: true,
                message: 'AI 요약 생성 성공',
                originalText: text,
                summary: summary
            });
        } else {
            res.json({
                success: false,
                message: 'AI 요약 생성 실패 (API 키 미설정 또는 텍스트가 너무 짧음)',
                originalText: text
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
