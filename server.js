// server.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 노션 클라이언트 초기화
const notion = new Client({
    auth: process.env.NOTION_API_KEY,
});

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// 로그 파일 경로
const LOG_FILE = path.join(__dirname, 'webhook_logs.json');

// 실행 중인 작업 추적용 (웹훅 ID별로 상태 관리)
const processingWebhooks = new Map();

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

// AI 요약 재생성 함수 (특정 웹훅용)
async function retrySummarizeText(webhookId, text) {
    // 실행 중인 웹훅인지 확인
    const webhook = processingWebhooks.get(webhookId);
    if (!webhook) {
        // 로그에서 웹훅 데이터 찾기
        try {
            const logs = await fs.readFile(LOG_FILE, 'utf-8');
            const logData = JSON.parse(logs);
            const webhookLog = logData.find(log => log.webhookId === webhookId && log.eventType === 'webhook_received');

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

// AI 요약 함수
async function summarizeText(text) {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            console.log('⚠️ OpenAI API 키가 설정되지 않았습니다');
            return null;
        }

        if (!text || text.trim().length < 10) {
            return '요약할 내용이 너무 짧습니다.';
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "당신은 한국어 텍스트를 간결하게 요약하는 AI입니다. 핵심 내용을 1-2문장으로 요약해주세요."
                },
                {
                    role: "user",
                    content: `다음 텍스트를 요약해주세요:\n\n${text}`
                }
            ],
            max_tokens: 150,
            temperature: 0.3
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ AI 요약 실패:', error.message);
        return '요약 생성에 실패했습니다.';
    }
}

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
async function saveLog(data, eventType = 'webhook_received', webhookId = null) {
    try {
        let logs = [];
        try {
            const existingLogs = await fs.readFile(LOG_FILE, 'utf-8');
            logs = JSON.parse(existingLogs);
        } catch (error) {
            // 파일이 없으면 새로 생성
        }

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

        await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('로그 저장 실패:', error);
    }
}

// Express static file serving for React app
app.use(express.static(path.join(__dirname, 'frontend/build')));

// React 라우팅을 위한 catch-all handler (모든 API 라우트 이후에 위치)
// 이는 파일 맨 끝에 추가될 예정

// 잔디 Webhook 수신 엔드포인트
app.post('/webhook/jandi', async (req, res) => {
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

    await saveLog(req.body, 'webhook_received', webhookId);

    try {
        // 웹훅이 이미 처리 중인지 확인 (중복 방지)
        if (processingWebhooks.has(webhookId)) {
            const existingWebhook = processingWebhooks.get(webhookId);
            if (existingWebhook.currentStep !== WEBHOOK_STEPS.RECEIVED) {
                console.log('⚠️ 이미 처리 중인 웹훅입니다:', webhookId);
                return res.status(409).json({
                    success: false,
                    error: '이미 처리 중인 웹훅입니다',
                    currentStep: existingWebhook.currentStep
                });
            }
        }

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
                await saveLog({
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
            text,           // 메시지 내용
            userName,       // 발신자 이름
            userEmail,      // 발신자 이메일
            createdAt,      // 메시지 작성 시간
            roomName,       // 대화방 이름
            teamName,       // 팀 이름
            token          // 검증용 토큰
        } = req.body;
        
        // 토큰 검증 (선택사항) - 테스트용으로 임시 비활성화
        // if (process.env.JANDI_WEBHOOK_TOKEN && token !== process.env.JANDI_WEBHOOK_TOKEN) {
        //     console.error('❌ 토큰 검증 실패');
        //     return res.status(401).json({ error: 'Unauthorized' });
        // }
        
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
        
        // 2단계: 노션에 페이지 생성 (현재 비활성화됨)
        /*
        if (process.env.NOTION_API_KEY && process.env.NOTION_DATABASE_ID) {
            const notionStartTime = new Date().toISOString();
            await saveLog({
                message: '노션 저장 시작',
                startTime: notionStartTime,
                data: req.body
            }, 'notion_save_start');

            const response = await notion.pages.create(notionData);
            const notionEndTime = new Date().toISOString();

            console.log('✅ 노션 페이지 생성 성공:', response.id);

            // 3단계: 노션 저장 완료 로그
            await saveLog({
                message: '노션 저장 완료',
                notionPageId: response.id,
                startTime: notionStartTime,
                endTime: notionEndTime,
                duration: new Date(notionEndTime) - new Date(notionStartTime)
            }, 'notion_save_complete');

            res.status(200).json({
                success: true,
                message: '노션에 저장되었습니다',
                notionPageId: response.id,
                timing: {
                    webhookReceived: webhookReceiveTime,
                    notionSaveStart: notionStartTime,
                    notionSaveEnd: notionEndTime,
                    totalDuration: new Date(notionEndTime) - new Date(webhookReceiveTime) + 'ms'
                }
            });
        } else {
        */
            // 최종 단계: 처리 완료
            updateWebhookStatus(webhookId, WEBHOOK_STEPS.COMPLETED);
            console.log('📝 잔디 웹훅 데이터를 로컬에만 저장합니다');

            await saveLog({
                message: '잔디 웹훅 수신 완료 (노션 연동 비활성화됨)',
                data: req.body,
                aiSummary: aiSummary
            }, 'webhook_processed', webhookId);

            res.status(200).json({
                success: true,
                message: '잔디 웹훅 데이터를 성공적으로 수신했습니다',
                webhookId: webhookId,
                data: req.body,
                aiSummary: aiSummary,
                timing: {
                    webhookReceived: webhookReceiveTime
                }
            });
        // }
        
    } catch (error) {
        console.error('❌ 에러 발생:', error);

        // 에러 발생시 상태 업데이트
        updateWebhookStatus(webhookId, WEBHOOK_STEPS.ERROR, {
            error: error.message
        });

        await saveLog({
            error: error.message,
            webhookData: req.body
        }, 'webhook_error', webhookId);

        res.status(500).json({
            success: false,
            webhookId: webhookId,
            error: error.message
        });
    }
});

// Admin API - 웹훅 상태 조회 엔드포인트
app.get('/admin/webhooks', async (req, res) => {
    try {
        // 현재 처리 중인 웹훅들
        const processing = Array.from(processingWebhooks.values()).filter(webhook =>
            webhook.currentStep !== WEBHOOK_STEPS.COMPLETED && webhook.currentStep !== WEBHOOK_STEPS.ERROR
        );

        // 최근 처리된 웹훅들 (로그에서)
        let recent = [];
        try {
            const logs = await fs.readFile(LOG_FILE, 'utf-8');
            const logData = JSON.parse(logs);

            // 완료된 웹훅들의 최종 상태 찾기
            const completedWebhooks = logData
                .filter(log => log.webhookId && (log.eventType === 'webhook_processed' || log.eventType === 'webhook_error'))
                .slice(-10) // 최근 10개만
                .map(log => {
                    // 해당 웹훅의 모든 단계 정보 수집
                    const webhookLogs = logData.filter(l => l.webhookId === log.webhookId);
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

            recent = completedWebhooks;
        } catch (error) {
            console.error('로그 읽기 오류:', error);
        }

        res.json({
            processing: processing,
            recent: recent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Admin API - AI 요약 재생성 엔드포인트
app.post('/admin/retry-ai-summary', async (req, res) => {
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
        const logs = await fs.readFile(LOG_FILE, 'utf-8');
        const logData = JSON.parse(logs);
        const webhookLog = logData.find(log => log.webhookId === webhookId && log.eventType === 'webhook_received');

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
            webhookId: webhookId,
            newSummary: newSummary,
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

// 로그 조회 엔드포인트
app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readFile(LOG_FILE, 'utf-8');
        res.json(JSON.parse(logs));
    } catch (error) {
        res.json([]);
    }
});

// 잔디로 메시지 보내기 엔드포인트
app.post('/send-to-jandi', async (req, res) => {
    const { body, connectColor, connectInfo } = req.body;

    console.log('📤 잔디로 메시지 전송 시도');

    try {
        if (!process.env.JANDI_OUTGOING_WEBHOOK_URL) {
            return res.status(400).json({
                success: false,
                error: '잔디 웹훅 URL이 설정되지 않았습니다'
            });
        }

        // 잔디 웹훅 메시지 형식
        const jandiMessage = {
            body: body || '메시지 내용이 없습니다',
            connectColor: connectColor || '#FAC11B',
            connectInfo: connectInfo ? [connectInfo] : []
        };

        // 잔디로 메시지 전송
        const response = await axios.post(process.env.JANDI_OUTGOING_WEBHOOK_URL, jandiMessage);

        console.log('✅ 잔디 메시지 전송 성공');

        // 로그 저장
        await saveLog({
            message: '잔디로 메시지 전송 완료',
            sentData: jandiMessage,
            response: response.status
        }, 'jandi_message_sent');

        res.json({
            success: true,
            message: '잔디로 메시지가 성공적으로 전송되었습니다',
            sentData: jandiMessage
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

// AI 요약 테스트 엔드포인트
app.post('/test-ai-summary', async (req, res) => {
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

// 테스트 엔드포인트 (개발용) - 노션 연동 비활성화됨
app.post('/test', async (req, res) => {
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
        await saveLog({...testData, aiSummary}, 'test_webhook');

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

// React 라우팅을 위한 catch-all handler (모든 API 라우트 이후에 위치)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log('=====================================');
    console.log('🚀 잔디-노션 Webhook 서버 시작 (React 통합)');
    console.log(`📍 로컬 주소: http://localhost:${PORT}`);
    console.log(`📍 메인 페이지: http://localhost:${PORT}/`);
    console.log(`📍 Admin 페이지: http://localhost:${PORT}/admin`);
    console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/jandi`);
    console.log('=====================================');
    console.log('설정 확인:');
    console.log(`- 노션 API 키: ${process.env.NOTION_API_KEY ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log(`- 노션 DB ID: ${process.env.NOTION_DATABASE_ID ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log('=====================================');
});