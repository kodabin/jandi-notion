import axios from 'axios';
import { API_BASE_URL } from '../constants';
import type {
  WebhooksResponse,
  MessageData,
  TestAISummaryResponse,
  RetryAISummaryResponse,
  Log
} from '../types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API 함수들
export const webhookApi = {
  // 웹훅 상태 조회
  getWebhooks: async (): Promise<WebhooksResponse> => {
    const response = await api.get('/admin/webhooks');
    return response.data;
  },

  // AI 요약 재생성
  retryAISummary: async (webhookId: string): Promise<RetryAISummaryResponse> => {
    const response = await api.post('/admin/retry-ai-summary', { webhookId });
    return response.data;
  },
};

export const messageApi = {
  // 잔디로 메시지 전송
  sendToJandi: async (messageData: MessageData) => {
    const response = await api.post('/send-to-jandi', messageData);
    return response.data;
  },

  // AI 요약 테스트
  testAISummary: async (text: string): Promise<TestAISummaryResponse> => {
    const response = await api.post('/test-ai-summary', { text });
    return response.data;
  },
};

export const logApi = {
  // 로그 조회
  getLogs: async (): Promise<Log[]> => {
    const response = await api.get('/logs');
    return response.data;
  },
};

export default api;