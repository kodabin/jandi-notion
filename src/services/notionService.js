const { Client } = require('@notionhq/client');
const config = require('../config/env');

// 노션 클라이언트 초기화
const notion = new Client({
    auth: config.notionApiKey,
});

/**
 * 노션 페이지 데이터 생성
 * @param {Object} webhookData - 웹훅 데이터
 * @returns {Object} - 노션 페이지 데이터
 */
function createNotionPageData(webhookData) {
    const { text, userName, roomName, teamName, createdAt } = webhookData;

    return {
        parent: {
            database_id: config.notionDatabaseId
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
}

/**
 * 노션에 페이지 생성
 * @param {Object} webhookData - 웹훅 데이터
 * @returns {Promise<Object>} - 노션 응답
 */
async function createNotionPage(webhookData) {
    if (!config.notionApiKey || !config.notionDatabaseId) {
        throw new Error('노션 API 키 또는 데이터베이스 ID가 설정되지 않았습니다');
    }

    const notionData = createNotionPageData(webhookData);
    const response = await notion.pages.create(notionData);
    return response;
}

module.exports = {
    createNotionPage,
    createNotionPageData
};
