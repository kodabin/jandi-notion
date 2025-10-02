const fs = require('fs').promises;
const path = require('path');
const { LOG_CONFIG } = require('../config/constants');

const LOG_FILE = path.join(__dirname, '../../webhook_logs.json');

/**
 * 로그 저장 함수
 * @param {Object} data - 로그 데이터
 * @param {string} eventType - 이벤트 타입
 * @param {string|null} webhookId - 웹훅 ID
 */
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
            eventType,
            data,
            webhookId
        });

        // 최근 100개만 유지
        if (logs.length > LOG_CONFIG.MAX_LOGS) {
            logs = logs.slice(-LOG_CONFIG.MAX_LOGS);
        }

        await fs.writeFile(LOG_FILE, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('로그 저장 실패:', error);
    }
}

/**
 * 로그 조회 함수
 * @returns {Promise<Array>} - 로그 배열
 */
async function getLogs() {
    try {
        const logs = await fs.readFile(LOG_FILE, 'utf-8');
        return JSON.parse(logs);
    } catch (error) {
        return [];
    }
}

module.exports = {
    saveLog,
    getLogs
};
