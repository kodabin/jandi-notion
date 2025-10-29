// OpenAI (ChatGPT) 유틸리티
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          content: text
        }
      ],
      max_tokens: 300,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('❌ AI 요약 실패:', error.message);
    return '요약 생성에 실패했습니다.';
  }
}

module.exports = { openai, summarizeText };
