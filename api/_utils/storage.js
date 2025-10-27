// Supabase 기반 저장소 (메모리 폴백 포함)
const { supabase } = require('./supabase');

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

// 메모리 기반 폴백 저장소 (Supabase 미사용 시)
const processingWebhooks = new Map();
let memoryLogs = [];

// 웹훅 생성 또는 업데이트
async function updateWebhookStatus(webhookId, step, data = {}) {
  if (supabase) {
    try {
      // Supabase 사용
      // 1. webhooks 테이블에서 기존 웹훅 찾기
      const { data: existingWebhook, error: fetchError } = await supabase
        .from('webhooks')
        .select('*')
        .eq('webhook_id', webhookId)
        .maybeSingle();

      if (fetchError) {
        console.error('웹훅 조회 오류:', fetchError);
      }

      // 2. 웹훅이 없으면 생성, 있으면 업데이트
      if (!existingWebhook) {
        // 새 웹훅 생성
        const { error: insertError } = await supabase
          .from('webhooks')
          .insert({
            webhook_id: webhookId,
            status: step,
            team_name: data.teamName || null,
            room_name: data.roomName || null,
            user_name: data.userName || null,
            text: data.text || null,
            ai_summary: data.aiSummary || null,
            notion_page_id: data.notionPageId || null,
          });

        if (insertError) {
          console.error('웹훅 생성 오류:', insertError);
        }
      } else {
        // 기존 웹훅 업데이트
        const updateData = {
          status: step,
          updated_at: new Date().toISOString(),
        };

        if (data.aiSummary) updateData.ai_summary = data.aiSummary;
        if (data.notionPageId) updateData.notion_page_id = data.notionPageId;

        const { error: updateError } = await supabase
          .from('webhooks')
          .update(updateData)
          .eq('webhook_id', webhookId);

        if (updateError) {
          console.error('웹훅 업데이트 오류:', updateError);
        }
      }

      // 3. webhook_steps 테이블에 단계 기록
      const { error: stepError } = await supabase
        .from('webhook_steps')
        .insert({
          webhook_id: webhookId,
          step: step,
          data: data,
        });

      if (stepError) {
        console.error('단계 기록 오류:', stepError);
      }

    } catch (error) {
      console.error('Supabase 오류:', error);
    }
  } else {
    // 메모리 기반 폴백
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
}

// 로그 저장 함수
async function saveLog(data, eventType = 'webhook_received', webhookId = null) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('logs')
        .insert({
          webhook_id: webhookId,
          event_type: eventType,
          data: data,
        });

      if (error) {
        console.error('로그 저장 오류:', error);
      }
    } catch (error) {
      console.error('Supabase 로그 오류:', error);
    }
  } else {
    // 메모리 기반 폴백
    memoryLogs.push({
      timestamp: new Date().toISOString(),
      eventType: eventType,
      data: data,
      webhookId: webhookId
    });

    // 최근 100개만 유지
    if (memoryLogs.length > 100) {
      memoryLogs = memoryLogs.slice(-100);
    }
  }
}

// 로그 조회
async function getLogs() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('로그 조회 오류:', error);
        return [];
      }

      // Supabase 형식을 기존 형식으로 변환
      return data.map(log => ({
        timestamp: log.created_at,
        eventType: log.event_type,
        data: log.data,
        webhookId: log.webhook_id
      }));
    } catch (error) {
      console.error('Supabase 로그 조회 오류:', error);
      return [];
    }
  } else {
    // 메모리 기반 폴백
    return memoryLogs;
  }
}

// 웹훅 상태 조회
async function getWebhooks() {
  if (supabase) {
    try {
      // 처리 중인 웹훅 조회 (최근 1시간 이내, completed/error 제외)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: processingData, error: processingError } = await supabase
        .from('webhooks')
        .select('*')
        .gte('created_at', oneHourAgo)
        .not('status', 'in', '(completed,error)')
        .order('created_at', { ascending: false });

      if (processingError) {
        console.error('처리 중인 웹훅 조회 오류:', processingError);
      }

      // 최근 완료된 웹훅 조회 (최근 10개)
      const { data: recentData, error: recentError } = await supabase
        .from('webhooks')
        .select('*')
        .in('status', ['completed', 'error'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentError) {
        console.error('최근 웹훅 조회 오류:', recentError);
      }

      // 각 웹훅의 단계 정보 가져오기
      const enrichWebhook = async (webhook) => {
        const { data: steps, error: stepsError } = await supabase
          .from('webhook_steps')
          .select('*')
          .eq('webhook_id', webhook.webhook_id)
          .order('created_at', { ascending: true });

        if (stepsError) {
          console.error('단계 조회 오류:', stepsError);
        }

        return {
          id: webhook.webhook_id,
          startTime: webhook.created_at,
          currentStep: webhook.status,
          steps: steps ? steps.map(s => ({
            step: s.step,
            timestamp: s.created_at,
            data: s.data || {}
          })) : [],
          data: {
            text: webhook.text || '',
            userName: webhook.user_name || '알 수 없음',
            roomName: webhook.room_name || '알 수 없음',
            teamName: webhook.team_name || '알 수 없음',
            aiSummary: webhook.ai_summary || null,
            notionPageId: webhook.notion_page_id || null
          }
        };
      };

      const processing = processingData ? await Promise.all(processingData.map(enrichWebhook)) : [];
      const recent = recentData ? await Promise.all(recentData.map(enrichWebhook)) : [];

      return {
        processing: processing,
        recent: recent
      };
    } catch (error) {
      console.error('Supabase 웹훅 조회 오류:', error);
      return { processing: [], recent: [] };
    }
  } else {
    // 메모리 기반 폴백
    const processing = Array.from(processingWebhooks.values()).filter(webhook =>
      webhook.currentStep !== WEBHOOK_STEPS.COMPLETED && webhook.currentStep !== WEBHOOK_STEPS.ERROR
    );

    // 최근 처리된 웹훅들 (로그에서)
    const completedWebhooks = memoryLogs
      .filter(log => log.webhookId && (log.eventType === 'webhook_processed' || log.eventType === 'webhook_error'))
      .slice(-10)
      .map(log => {
        const webhookLogs = memoryLogs.filter(l => l.webhookId === log.webhookId);
        const steps = [];

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
}

module.exports = {
  processingWebhooks,
  WEBHOOK_STEPS,
  updateWebhookStatus,
  saveLog,
  getLogs,
  getWebhooks,
  supabase
};
