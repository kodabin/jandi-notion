const axios = require('axios');
const config = require('../config/env');

/**
 * 잔디로 메시지 전송
 * @param {Object} messageData - 메시지 데이터
 * @param {string} messageData.body - 메시지 본문
 * @param {string} messageData.connectColor - 메시지 색상
 * @param {string} messageData.connectInfo - 추가 정보
 * @returns {Promise<Object>} - 응답 데이터
 */
async function sendMessageToJandi(messageData) {
    if (!config.jandiOutgoingWebhookUrl) {
        throw new Error('잔디 웹훅 URL이 설정되지 않았습니다');
    }

    const jandiMessage = {
        body: messageData.body || '메시지 내용이 없습니다',
        connectColor: messageData.connectColor || '#FAC11B',
        connectInfo: messageData.connectInfo ? [messageData.connectInfo] : []
    };

    const response = await axios.post(config.jandiOutgoingWebhookUrl, jandiMessage);
    return {
        status: response.status,
        sentData: jandiMessage
    };
}

module.exports = {
    sendMessageToJandi
};
