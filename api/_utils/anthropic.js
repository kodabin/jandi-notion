// Anthropic (Claude AI) 유틸리티
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// AI 요약 함수
async function summarizeText(text) {
  try {
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'your_anthropic_api_key_here') {
      console.log('⚠️ Claude AI API 키가 설정되지 않았습니다');
      return null;
    }

    if (!text || text.trim().length < 10) {
      return '요약할 내용이 너무 짧습니다.';
    }

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `당신은 한국어 텍스트를 간결하게 요약하는 AI입니다. 다음 텍스트의 핵심 내용을 1-2문장으로 요약해주세요:\n\n${text}`
        }
      ],
      temperature: 0.3
    });

    return response.content[0].text.trim();
  } catch (error) {
    console.error('❌ AI 요약 실패:', error.message);
    return '요약 생성에 실패했습니다.';
  }
}

module.exports = { anthropic, summarizeText };
