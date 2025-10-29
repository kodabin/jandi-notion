// POST /api/admin/retry-ai-summary
// AI 요약 재생성 엔드포인트

const { summarizeText } = require('../_utils/openai');
const { processingWebhooks, updateWebhookStatus, saveLog, getLogs, WEBHOOK_STEPS } = require('../_utils/storage');

module.exports = async (req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { webhookId } = req.body;

  if (!webhookId) {
    return res.status(400).json({
      success: false,
      error: 'webhookId가 필요합니다'
    });
  }

  try {
    // 기존 웹훅이 처리 중인지 확인
    const existingWebhook = processingWebhooks.get(webhookId);
    if (existingWebhook && existingWebhook.currentStep !== WEBHOOK_STEPS.COMPLETED && existingWebhook.currentStep !== WEBHOOK_STEPS.ERROR) {
      return res.status(409).json({
        success: false,
        error: '해당 웹훅이 아직 처리 중입니다'
      });
    }

    // 로그에서 원본 텍스트 찾기
    const logs = getLogs();
    const webhookLog = logs.find(log => log.webhookId === webhookId && log.eventType === 'webhook_received');

    if (!webhookLog || !webhookLog.data.text) {
      return res.status(404).json({
        success: false,
        error: '웹훅 데이터를 찾을 수 없거나 텍스트가 없습니다'
      });
    }

    console.log('🔄 AI 요약 재생성 시작:', webhookId);

    // 새로운 처리 상태 생성
    updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_START, {
      text: webhookLog.data.text,
      userName: webhookLog.data.userName,
      roomName: webhookLog.data.roomName,
      teamName: webhookLog.data.teamName,
      createdAt: webhookLog.data.createdAt,
      isRetry: true
    });

    // AI 요약 재생성 실행
    const newSummary = await summarizeText(webhookLog.data.text);

    if (newSummary) {
      // AI 요약 완료 상태 업데이트
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_COMPLETE, {
        aiSummary: newSummary,
        isRetry: true
      });

      // 재생성 로그 저장
      saveLog({
        originalText: webhookLog.data.text,
        summary: newSummary,
        author: webhookLog.data.userName || '알 수 없음',
        room: webhookLog.data.roomName || '알 수 없음',
        retryTimestamp: new Date().toISOString()
      }, 'ai_summary_regenerated', webhookId);

      res.json({
        success: true,
        message: 'AI 요약이 성공적으로 재생성되었습니다',
        webhookId: webhookId,
        newSummary: newSummary,
        originalText: webhookLog.data.text
      });
    } else {
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
        error: 'AI 요약 재생성 실패'
      });
      throw new Error('AI 요약 생성 실패');
    }

  } catch (error) {
    console.error('❌ AI 요약 재생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
