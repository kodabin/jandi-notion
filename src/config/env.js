require('dotenv').config();

const config = {
    port: process.env.PORT || 3000,
    notionApiKey: process.env.NOTION_API_KEY,
    notionDatabaseId: process.env.NOTION_DATABASE_ID,
    openaiApiKey: process.env.OPENAI_API_KEY,
    jandiWebhookToken: process.env.JANDI_WEBHOOK_TOKEN,
    jandiOutgoingWebhookUrl: process.env.JANDI_OUTGOING_WEBHOOK_URL
};

module.exports = config;
