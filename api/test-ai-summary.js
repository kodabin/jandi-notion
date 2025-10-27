// POST /api/test-ai-summary
// AI 요약 테스트 엔드포인트

const { summarizeText } = require('./_utils/anthropic');
const { saveLog } = require('./_utils/storage');

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
      saveLog({
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
};
