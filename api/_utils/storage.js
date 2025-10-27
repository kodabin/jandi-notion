// Vercel Serverless에서는 파일 시스템을 사용할 수 없으므로
// 메모리 기반 저장소 사용 (프로덕션에서는 Vercel KV, Redis, DB 사용 권장)

// 웹훅 처리 상태 (In-Memory)
const processingWebhooks = new Map();

// 웹훅 단계 정의
const WEBHOOK_STEPS = {
  RECEIVED: 'received',
  AI_SUMMARY_START: 'ai_summary_start',
  AI_SUMMARY_COMPLETE: 'ai_summary_complete',
  NOTION_SAVE_START: 'notion_save_start',
  NOTION_SAVE_COMPLETE: 'notion_save_complete',
  COMPLETED: 'completed',
  ERROR: 'error'
};

// 로그 저장소 (메모리 기반 - 최근 100개만 유지)
let logs = [];

// 웹훅 처리 상태 업데이트 함수
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
    step: step,
    timestamp: new Date().toISOString(),
    data: data
  });
  webhook.data = { ...webhook.data, ...data };

  // 완료되거나 에러인 경우 일정 시간 후 제거
  if (step === WEBHOOK_STEPS.COMPLETED || step === WEBHOOK_STEPS.ERROR) {
    setTimeout(() => {
      processingWebhooks.delete(webhookId);
    }, 300000); // 5분 후 제거
  }
}

// 로그 저장 함수
function saveLog(data, eventType = 'webhook_received', webhookId = null) {
  logs.push({
    timestamp: new Date().toISOString(),
    eventType: eventType,
    data: data,
    webhookId: webhookId
  });

  // 최근 100개만 유지
  if (logs.length > 100) {
    logs = logs.slice(-100);
  }
}

// 로그 조회
function getLogs() {
  return logs;
}

// 웹훅 상태 조회
function getWebhooks() {
  // 현재 처리 중인 웹훅들
  const processing = Array.from(processingWebhooks.values()).filter(webhook =>
    webhook.currentStep !== WEBHOOK_STEPS.COMPLETED && webhook.currentStep !== WEBHOOK_STEPS.ERROR
  );

  // 최근 처리된 웹훅들 (로그에서)
  const completedWebhooks = logs
    .filter(log => log.webhookId && (log.eventType === 'webhook_processed' || log.eventType === 'webhook_error'))
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

      const aiSummaryLog = webhookLogs.find(l => l.eventType === 'ai_summary_generated' || l.eventType === 'ai_summary_regenerated');
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
        currentStep: log.eventType === 'webhook_error' ? WEBHOOK_STEPS.ERROR : WEBHOOK_STEPS.COMPLETED,
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

  return {
    processing: processing,
    recent: completedWebhooks
  };
}

module.exports = {
  processingWebhooks,
  WEBHOOK_STEPS,
  updateWebhookStatus,
  saveLog,
  getLogs,
  getWebhooks
};
