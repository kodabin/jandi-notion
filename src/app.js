const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

// Routes
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messageRoutes = require('./routes/messageRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Express static file serving for React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API 라우트 설정
app.use('/webhook', webhookRoutes);
app.use('/admin', adminRoutes);
app.use('/', messageRoutes);
app.use('/', testRoutes);

// React 라우팅을 위한 catch-all handler (모든 API 라우트 이후에 위치)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

module.exports = app;
