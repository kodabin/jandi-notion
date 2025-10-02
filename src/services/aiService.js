const OpenAI = require('openai');
const config = require('../config/env');
const { AI_CONFIG } = require('../config/constants');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
    apiKey: config.openaiApiKey,
});

/**
 * AI 요약 함수
 * @param {string} text - 요약할 텍스트
 * @returns {Promise<string|null>} - 요약된 텍스트 또는 null
 */
async function summarizeText(text) {
    try {
        if (!config.openaiApiKey || config.openaiApiKey === 'your_openai_api_key_here') {
            console.log('⚠️ OpenAI API 키가 설정되지 않았습니다');
            return null;
        }

        if (!text || text.trim().length < AI_CONFIG.MIN_TEXT_LENGTH) {
            return '요약할 내용이 너무 짧습니다.';
        }

        const response = await openai.chat.completions.create({
            model: AI_CONFIG.MODEL,
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
            max_tokens: AI_CONFIG.MAX_TOKENS,
            temperature: AI_CONFIG.TEMPERATURE
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ AI 요약 실패:', error.message);
        return '요약 생성에 실패했습니다.';
    }
}

module.exports = {
    summarizeText
};
