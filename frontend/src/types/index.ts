// 로그 관련 타입
export interface Log {
  timestamp: string;
  eventType: string;
  data: any;
  webhookId?: string;
}

// 웹훅 관련 타입
export interface WebhookStep {
  step: string;
  timestamp: string;
  data: any;
}

export interface WebhookData {
  id: string;
  startTime: string;
  currentStep: string;
  steps: WebhookStep[];
  data: {
    text: string;
    userName: string;
    roomName: string;
    teamName: string;
    aiSummary?: string;
  };
}

export interface WebhooksResponse {
  processing: WebhookData[];
  recent: WebhookData[];
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface MessageData {
  body: string;
  connectColor?: string;
  connectInfo?: string;
}

export interface TestAISummaryResponse {
  success: boolean;
  message?: string;
  summary?: string;
  originalText?: string;
}

export interface RetryAISummaryResponse {
  success: boolean;
  message?: string;
  error?: string;
  webhookId?: string;
  newSummary?: string;
  originalText?: string;
}
