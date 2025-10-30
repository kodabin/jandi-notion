// 로컬 개발용 Express 서버
// Vercel Serverless Functions를 로컬에서 테스트하기 위한 서버

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 프론트엔드 정적 파일 서빙 (조건부)
const frontendBuildPath = path.join(__dirname, 'frontend', 'build');

// static 폴더만 명시적으로 서빙
app.use('/static', express.static(path.join(frontendBuildPath, 'static')));

// favicon, manifest 등
app.use(express.static(frontendBuildPath, {
  index: false, // index.html 자동 서빙 비활성화
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API 라우트
app.post('/api/webhook/jandi', require('./api/webhook/jandi'));
app.get('/api/admin/webhooks', require('./api/admin/webhooks'));
app.post('/api/admin/retry-ai-summary', require('./api/admin/retry-ai-summary'));
app.get('/api/logs', require('./api/logs'));
app.post('/api/test-ai-summary', require('./api/test-ai-summary'));
app.post('/api/send-to-jandi', require('./api/send-to-jandi'));

// React SPA - 모든 HTML 요청은 index.html로
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'), (err) => {
    if (err) {
      console.error('❌ index.html 전송 실패:', err);
      res.status(500).send('페이지를 불러올 수 없습니다.');
    }
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  console.log(`📝 API: http://localhost:${PORT}/api/*`);
  console.log(`🔧 관리자: http://localhost:${PORT}/admin`);
});
