// POST /api/send-to-jandi
// 잔디로 메시지 보내기 엔드포인트

const axios = require('axios');
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
    saveLog({
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

    saveLog({
      message: '잔디 메시지 전송 실패',
      error: error.message,
      requestData: req.body
    }, 'jandi_message_failed');

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
