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

// 로그 저장 함수
async function saveLog(data, eventType = 'webhook_received') {
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
            data: data
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

// 헬스 체크 엔드포인트
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>잔디-노션 Webhook 서버</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .status { color: green; font-weight: bold; }
                    .info { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
                    .logs-container { background: #000; color: #0f0; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; font-family: monospace; }
                    .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #0f0; }
                    .webhook-received { border-left-color: #00f; }
                    .notion-save-start { border-left-color: #ff0; }
                    .notion-save-complete { border-left-color: #0f0; }
                    .error { border-left-color: #f00; }
                    .ai-summary-generated { border-left-color: #9c27b0; }
                    .ai-summary { background: #f3e5f5; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 4px solid #9c27b0; }
                    button { padding: 10px 20px; margin: 5px; background: #007cba; color: white; border: none; border-radius: 3px; cursor: pointer; }
                    button:hover { background: #005a87; }
                </style>
            </head>
            <body>
                <h1>🚀 잔디-노션 Webhook 서버</h1>
                <p class="status">✅ 서버가 정상적으로 실행중입니다!</p>
                <div class="info">
                    <h3>설정 상태:</h3>
                    <ul>
                        <li>포트: ${PORT}</li>
                        <li>노션 API 연결: ${process.env.NOTION_API_KEY ? '✅ 설정됨' : '❌ 미설정'}</li>
                        <li>노션 데이터베이스 ID: ${process.env.NOTION_DATABASE_ID ? '✅ 설정됨' : '❌ 미설정'}</li>
                    </ul>
                </div>
                <div class="info">
                    <h3>Webhook URL:</h3>
                    <code>${process.env.SERVER_URL || `http://localhost:${PORT}`}/webhook/jandi</code>
                </div>
                <div class="info">
                    <h3>💬 잔디로 메시지 보내기:</h3>
                    <form id="messageForm">
                        <div style="margin: 10px 0;">
                            <label for="messageBody">메시지 내용:</label><br>
                            <textarea id="messageBody" rows="3" style="width: 100%; padding: 5px;" placeholder="잔디로 보낼 메시지를 입력하세요..."></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label for="messageColor">색상:</label>
                            <select id="messageColor" style="padding: 5px;">
                                <option value="#FAC11B">노란색 (기본)</option>
                                <option value="#36a64f">초록색</option>
                                <option value="#ff0000">빨간색</option>
                                <option value="#0000ff">파란색</option>
                                <option value="#800080">보라색</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label for="connectInfo">추가 정보 (선택사항):</label><br>
                            <input type="text" id="connectInfo" style="width: 100%; padding: 5px;" placeholder="추가 정보나 링크">
                        </div>
                        <div style="margin: 10px 0;">
                            <button type="submit">잔디로 메시지 보내기</button>
                            <button type="button" id="aiSummaryBtn" style="background: #9c27b0;">🤖 AI 요약해서 보내기</button>
                        </div>
                    </form>
                    <div id="aiSummaryPreview" style="margin-top: 10px; display: none;">
                        <div style="background: #f3e5f5; padding: 10px; border-radius: 5px; border-left: 4px solid #9c27b0;">
                            <strong>🤖 AI 요약 결과:</strong>
                            <div id="summaryResult" style="margin: 5px 0; font-style: italic;"></div>
                            <div style="margin-top: 10px;">
                                <button id="sendSummaryBtn" style="background: #9c27b0;">요약된 내용으로 전송</button>
                                <button id="cancelSummaryBtn" style="background: #666;">취소</button>
                            </div>
                        </div>
                    </div>
                    <div id="sendResult" style="margin-top: 10px;"></div>
                </div>
                <div class="info">
                    <h3>실시간 로그 모니터링:</h3>
                    <button onclick="loadLogs()">로그 새로고침</button>
                    <button onclick="autoRefresh()">자동 새로고침 시작/정지</button>
                    <div id="logs" class="logs-container">
                        로그를 불러오는 중...
                    </div>
                </div>

                <script>
                    let autoRefreshInterval;
                    let isAutoRefresh = false;

                    // 메시지 전송 함수
                    async function sendMessage(messageText) {
                        const messageColor = document.getElementById('messageColor').value;
                        const connectInfo = document.getElementById('connectInfo').value;
                        const resultDiv = document.getElementById('sendResult');

                        resultDiv.innerHTML = '<div style="color: blue;">메시지 전송 중...</div>';

                        try {
                            const response = await fetch('/send-to-jandi', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    body: messageText,
                                    connectColor: messageColor,
                                    connectInfo: connectInfo || undefined
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                resultDiv.innerHTML = '<div style="color: green;">✅ ' + result.message + '</div>';
                                document.getElementById('messageBody').value = '';
                                document.getElementById('connectInfo').value = '';
                                // 요약 미리보기 숨기기
                                document.getElementById('aiSummaryPreview').style.display = 'none';
                                // 로그 새로고침
                                loadLogs();
                            } else {
                                resultDiv.innerHTML = '<div style="color: red;">❌ ' + result.error + '</div>';
                            }
                        } catch (error) {
                            resultDiv.innerHTML = '<div style="color: red;">❌ 전송 실패: ' + error.message + '</div>';
                        }
                    }

                    // 잔디로 메시지 보내기 폼 처리 (일반 전송)
                    document.getElementById('messageForm').addEventListener('submit', async function(e) {
                        e.preventDefault();

                        const messageBody = document.getElementById('messageBody').value;

                        if (!messageBody.trim()) {
                            document.getElementById('sendResult').innerHTML = '<div style="color: red;">메시지 내용을 입력해주세요.</div>';
                            return;
                        }

                        await sendMessage(messageBody);
                    });

                    // AI 요약해서 보내기 버튼 처리
                    document.getElementById('aiSummaryBtn').addEventListener('click', async function() {
                        const messageBody = document.getElementById('messageBody').value;
                        const resultDiv = document.getElementById('sendResult');
                        const summaryPreview = document.getElementById('aiSummaryPreview');
                        const summaryResult = document.getElementById('summaryResult');

                        if (!messageBody.trim()) {
                            resultDiv.innerHTML = '<div style="color: red;">요약할 메시지 내용을 입력해주세요.</div>';
                            return;
                        }

                        // 요약 생성 중 표시
                        summaryResult.innerHTML = '🤖 AI가 요약을 생성하고 있습니다...';
                        summaryPreview.style.display = 'block';
                        resultDiv.innerHTML = '<div style="color: blue;">AI 요약 생성 중...</div>';

                        try {
                            const response = await fetch('/test-ai-summary', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    text: messageBody
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                summaryResult.innerHTML = result.summary;
                                resultDiv.innerHTML = '<div style="color: green;">✅ AI 요약 완료! 확인 후 전송하세요.</div>';

                                // 요약된 내용을 전역 변수에 저장
                                window.currentSummary = result.summary;
                            } else {
                                summaryResult.innerHTML = '요약 생성에 실패했습니다: ' + result.message;
                                resultDiv.innerHTML = '<div style="color: red;">❌ ' + result.message + '</div>';
                            }
                        } catch (error) {
                            summaryResult.innerHTML = '요약 생성 중 오류가 발생했습니다.';
                            resultDiv.innerHTML = '<div style="color: red;">❌ 요약 생성 실패: ' + error.message + '</div>';
                        }
                    });

                    // 요약된 내용으로 전송 버튼 처리
                    document.getElementById('sendSummaryBtn').addEventListener('click', async function() {
                        if (window.currentSummary) {
                            await sendMessage(window.currentSummary);
                        }
                    });

                    // 요약 취소 버튼 처리
                    document.getElementById('cancelSummaryBtn').addEventListener('click', function() {
                        document.getElementById('aiSummaryPreview').style.display = 'none';
                        document.getElementById('sendResult').innerHTML = '';
                        window.currentSummary = null;
                    });

                    async function loadLogs() {
                        try {
                            const response = await fetch('/logs');
                            const logs = await response.json();
                            const logsContainer = document.getElementById('logs');

                            if (logs.length === 0) {
                                logsContainer.innerHTML = '<div class="log-entry">아직 로그가 없습니다.</div>';
                                return;
                            }

                            logsContainer.innerHTML = logs.map(log => {
                                const time = new Date(log.timestamp).toLocaleString('ko-KR');
                                const eventClass = log.eventType ? log.eventType.replace('_', '-') : 'default';

                                let content = '';
                                if (log.eventType === 'ai_summary_generated') {
                                    content = \`
                                        <div class="ai-summary">
                                            <strong>🤖 AI 요약:</strong> \${log.data.summary}<br>
                                            <small>작성자: \${log.data.author || '알 수 없음'} | 방: \${log.data.room || '알 수 없음'}</small><br>
                                            <details style="margin-top: 5px;">
                                                <summary>원본 메시지 보기</summary>
                                                <div style="background: #fff; padding: 5px; margin-top: 5px; border-radius: 3px;">
                                                    \${log.data.originalText}
                                                </div>
                                            </details>
                                        </div>
                                    \`;
                                } else {
                                    content = JSON.stringify(log.data, null, 2);
                                }

                                return \`
                                    <div class="log-entry \${eventClass}">
                                        <strong>[\${time}] \${log.eventType || 'unknown'}</strong><br>
                                        \${content}
                                    </div>
                                \`;
                            }).reverse().join('');

                            // 최신 로그로 스크롤
                            logsContainer.scrollTop = 0;
                        } catch (error) {
                            document.getElementById('logs').innerHTML = '<div class="log-entry error">로그 로딩 실패: ' + error.message + '</div>';
                        }
                    }

                    function autoRefresh() {
                        if (isAutoRefresh) {
                            clearInterval(autoRefreshInterval);
                            isAutoRefresh = false;
                        } else {
                            autoRefreshInterval = setInterval(loadLogs, 2000);
                            isAutoRefresh = true;
                        }
                    }

                    // 페이지 로드시 로그 불러오기
                    loadLogs();
                </script>
            </body>
        </html>
    `);
});

// 잔디 Webhook 수신 엔드포인트
app.post('/webhook/jandi', async (req, res) => {
    const webhookReceiveTime = new Date().toISOString();
    console.log('📨 잔디 Webhook 수신:', webhookReceiveTime);
    console.log('받은 데이터:', JSON.stringify(req.body, null, 2));

    // 1단계: 웹훅 수신 즉시 로그 저장 (노션보다 먼저)
    await saveLog(req.body, 'webhook_received');

    try {
        // AI 요약 생성
        let aiSummary = null;
        if (req.body.text) {
            console.log('🤖 AI 요약 생성 중...');
            aiSummary = await summarizeText(req.body.text);
            if (aiSummary) {
                console.log('✅ AI 요약 완료:', aiSummary);
                // AI 요약 로그 저장
                await saveLog({
                    originalText: req.body.text,
                    summary: aiSummary,
                    author: req.body.userName,
                    room: req.body.roomName
                }, 'ai_summary_generated');
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
        
        // 토큰 검증 (선택사항)
        if (process.env.JANDI_WEBHOOK_TOKEN && token !== process.env.JANDI_WEBHOOK_TOKEN) {
            console.error('❌ 토큰 검증 실패');
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
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
            console.log('📝 잔디 웹훅 데이터를 로컬에만 저장합니다');
            await saveLog({
                message: '잔디 웹훅 수신 완료 (노션 연동 비활성화됨)',
                data: req.body,
                aiSummary: aiSummary
            }, 'webhook_processed');

            res.status(200).json({
                success: true,
                message: '잔디 웹훅 데이터를 성공적으로 수신했습니다',
                data: req.body,
                aiSummary: aiSummary,
                timing: {
                    webhookReceived: webhookReceiveTime
                }
            });
        // }
        
    } catch (error) {
        console.error('❌ 에러 발생:', error);
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

// 서버 시작
app.listen(PORT, () => {
    console.log('=====================================');
    console.log('🚀 잔디-노션 Webhook 서버 시작');
    console.log(`📍 로컬 주소: http://localhost:${PORT}`);
    console.log(`📍 Webhook URL: http://localhost:${PORT}/webhook/jandi`);
    console.log('=====================================');
    console.log('설정 확인:');
    console.log(`- 노션 API 키: ${process.env.NOTION_API_KEY ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log(`- 노션 DB ID: ${process.env.NOTION_DATABASE_ID ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log('=====================================');
});