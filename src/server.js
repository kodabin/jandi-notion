const app = require('./app');
const config = require('./config/env');

const PORT = config.port;

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
    console.log(`- 노션 API 키: ${config.notionApiKey ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log(`- 노션 DB ID: ${config.notionDatabaseId ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log(`- OpenAI API 키: ${config.openaiApiKey ? '✅' : '❌ (.env 파일에 설정 필요)'}`);
    console.log('=====================================');
});
