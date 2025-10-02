const express = require('express');
const { processWebhook } = require('../services/webhookService');
const { generateWebhookId } = require('../utils/webhookTracker');
const { saveLog } = require('../utils/logger');
const { WEBHOOK_STEPS } = require('../config/constants');

const router = express.Router();

/**
 * 잔디 Webhook 수신 엔드포인트
 */
router.post('/jandi', async (req, res) => {
    const webhookId = generateWebhookId();

    console.log('📨 잔디 Webhook 수신:', new Date().toISOString(), 'ID:', webhookId);
    console.log('받은 데이터:', JSON.stringify(req.body, null, 2));

    try {
        const result = await processWebhook(req.body, webhookId);

        if (!result.success) {
            return res.status(409).json(result);
        }

        res.status(200).json(result);
    } catch (error) {
        console.error('❌ 에러 발생:', error);

        await saveLog({
            error: error.message,
            webhookData: req.body
        }, 'webhook_error', webhookId);

        res.status(500).json({
            success: false,
            webhookId: webhookId,
            error: error.message
        });
    }
});

module.exports = router;
