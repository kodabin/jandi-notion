// POST /api/webhook/jandi
// 잔디 Webhook 수신 엔드포인트

const { notion } = require('../_utils/notion');
const { summarizeText } = require('../_utils/anthropic');
const { updateWebhookStatus, saveLog, WEBHOOK_STEPS } = require('../_utils/storage');

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

  const webhookReceiveTime = new Date().toISOString();
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('📨 잔디 Webhook 수신:', webhookReceiveTime, 'ID:', webhookId);
  console.log('받은 데이터:', JSON.stringify(req.body, null, 2));

  // 1단계: 웹훅 수신 - 상태 추적 시작
  updateWebhookStatus(webhookId, WEBHOOK_STEPS.RECEIVED, {
    text: req.body.text,
    userName: req.body.userName,
    roomName: req.body.roomName,
    teamName: req.body.teamName,
    createdAt: req.body.createdAt
  });

  saveLog(req.body, 'webhook_received', webhookId);

  try {
    // AI 요약 생성
    let aiSummary = null;
    if (req.body.text) {
      // 2단계: AI 요약 시작
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_START);
      console.log('🤖 AI 요약 생성 중...');

      aiSummary = await summarizeText(req.body.text);

      if (aiSummary) {
        // 3단계: AI 요약 완료
        updateWebhookStatus(webhookId, WEBHOOK_STEPS.AI_SUMMARY_COMPLETE, {
          aiSummary: aiSummary
        });
        console.log('✅ AI 요약 완료:', aiSummary);

        // AI 요약 로그 저장
        saveLog({
          originalText: req.body.text,
          summary: aiSummary,
          author: req.body.userName,
          room: req.body.roomName
        }, 'ai_summary_generated', webhookId);
      } else {
        updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
          error: 'AI 요약 생성 실패'
        });
      }
    }

    // 잔디에서 오는 데이터 파싱
    const {
      text,
      userName,
      createdAt,
      roomName,
      teamName,
    } = req.body;

    // 노션에 저장할 데이터 준비
    const notionData = {
      parent: {
        database_id: process.env.NOTION_DATABASE_ID
      },
      properties: {
        '제목': {
          title: [
            {
              text: {
                content: `[${roomName}] ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
              }
            }
          ]
        },
        '내용': {
          rich_text: [
            {
              text: {
                content: text || ''
              }
            }
          ]
        },
        '작성자': {
          rich_text: [
            {
              text: {
                content: userName || '알 수 없음'
              }
            }
          ]
        },
        '대화방': {
          select: {
            name: roomName || '일반'
          }
        },
        '팀': {
          select: {
            name: teamName || '기본팀'
          }
        },
        '작성일': {
          date: {
            start: createdAt || new Date().toISOString()
          }
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: `원본 메시지:\n${text}`
                }
              }
            ]
          }
        }
      ]
    };

    // AI 요약이 있으면 Notion에 추가
    if (aiSummary && aiSummary !== '요약 생성에 실패했습니다.' && aiSummary !== null) {
      notionData.children.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: {
            emoji: '🤖'
          },
          rich_text: [
            {
              type: 'text',
              text: {
                content: `AI 요약:\n${aiSummary}`
              }
            }
          ],
          color: 'blue_background'
        }
      });
    }

    // Notion에 페이지 생성
    if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
      // 4단계: Notion 저장 시작
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.NOTION_SAVE_START);
      const notionStartTime = new Date().toISOString();

      console.log('📝 Notion에 저장 중...');
      saveLog({
        message: 'Notion 저장 시작',
        startTime: notionStartTime,
        data: req.body,
        aiSummary: aiSummary
      }, 'notion_save_start', webhookId);

      const response = await notion.pages.create(notionData);
      const notionEndTime = new Date().toISOString();

      console.log('✅ Notion 페이지 생성 성공:', response.id);

      // 5단계: Notion 저장 완료
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.NOTION_SAVE_COMPLETE, {
        notionPageId: response.id
      });

      saveLog({
        message: 'Notion 저장 완료',
        notionPageId: response.id,
        startTime: notionStartTime,
        endTime: notionEndTime,
        duration: new Date(notionEndTime) - new Date(notionStartTime)
      }, 'notion_save_complete', webhookId);

      // 6단계: 전체 처리 완료
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.COMPLETED);

      res.status(200).json({
        success: true,
        message: 'Notion에 저장되었습니다',
        webhookId: webhookId,
        notionPageId: response.id,
        aiSummary: aiSummary,
        timing: {
          webhookReceived: webhookReceiveTime,
          notionSaveStart: notionStartTime,
          notionSaveEnd: notionEndTime,
          totalDuration: new Date(notionEndTime) - new Date(webhookReceiveTime) + 'ms'
        }
      });
    } else {
      // Notion API 키가 없는 경우 로컬에만 저장
      updateWebhookStatus(webhookId, WEBHOOK_STEPS.COMPLETED);
      console.log('📝 잔디 웹훅 데이터를 메모리에만 저장합니다 (Notion API 키 미설정)');

      saveLog({
        message: '잔디 웹훅 수신 완료 (Notion 연동 비활성화됨)',
        data: req.body,
        aiSummary: aiSummary
      }, 'webhook_processed', webhookId);

      res.status(200).json({
        success: true,
        message: '잔디 웹훅 데이터를 성공적으로 수신했습니다 (Notion 미연동)',
        webhookId: webhookId,
        data: req.body,
        aiSummary: aiSummary,
        timing: {
          webhookReceived: webhookReceiveTime
        }
      });
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error);

    // 에러 발생시 상태 업데이트
    updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
      error: error.message
    });

    saveLog({
      error: error.message,
      webhookData: req.body
    }, 'webhook_error', webhookId);

    res.status(500).json({
      success: false,
      webhookId: webhookId,
      error: error.message
    });
  }
};
