const express = require('express');
const { summarizeText } = require('../services/aiService');
const { saveLog, getLogs } = require('../utils/logger');

const router = express.Router();

/**
 * 로그 조회 엔드포인트
 */
router.get('/logs', async (req, res) => {
    try {
        const logs = await getLogs();
        res.json(logs);
    } catch (error) {
        res.json([]);
    }
});

/**
 * 테스트 엔드포인트 (개발용)
 */
router.post('/test', async (req, res) => {
    // 테스트 데이터로 웹훅 수신 테스트
    const testData = {
        text: '오늘 프로젝트 회의에서 새로운 기능 개발에 대해 논의했습니다. 사용자 인터페이스 개선과 데이터베이스 최적화가 주요 안건이었고, 다음 주까지 프로토타입을 완성하기로 결정했습니다.',
        userName: '테스트 사용자',
        roomName: '테스트 룸',
        teamName: '테스트 팀',
        createdAt: new Date().toISOString()
    };

    console.log('🧪 웹훅 수신 테스트 실행');

    try {
        // AI 요약 생성 (실제 웹훅처럼)
        let aiSummary = null;
        if (testData.text) {
            aiSummary = await summarizeText(testData.text);
            if (aiSummary) {
                await saveLog({
                    originalText: testData.text,
                    summary: aiSummary,
                    author: testData.userName,
                    room: testData.roomName
                }, 'ai_summary_generated');
            }
        }

        // 로그에만 저장 (노션 연동 비활성화됨)
        await saveLog({ ...testData, aiSummary }, 'test_webhook');

        res.json({
            success: true,
            message: '테스트 웹훅 수신 성공 (노션 연동 비활성화됨)',
            data: testData,
            aiSummary: aiSummary
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
