import React, { useState, useEffect } from 'react';
import { webhookApi } from '../services/api';
import { STEP_NAMES, STEP_ORDER, AUTO_REFRESH_INTERVAL } from '../constants';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatTimestamp, truncateText } from '../utils/formatters';
import type { WebhookData, WebhooksResponse } from '../types';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const [webhooks, setWebhooks] = useState<WebhooksResponse>({ processing: [], recent: [] });
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  // 단계 이름 가져오기
  const getStepName = (step: string): string => {
    return STEP_NAMES[step] || step;
  };

  // 웹훅 데이터 로드
  const loadWebhooks = async () => {
    try {
      const data = await webhookApi.getWebhooks();
      setWebhooks(data);
      setLoading(false);
    } catch (error) {
      console.error('웹훅 데이터 로딩 실패:', error);
      setLoading(false);
    }
  };

  // AI 요약 재생성
  const retryAISummary = async (webhookId: string) => {
    const button = document.querySelector(`[data-webhook-id=\"${webhookId}\"]`) as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = '재생성 중...';
    }

    try {
      const result = await webhookApi.retryAISummary(webhookId);

      if (result.success) {
        loadWebhooks(); // 새로고침
      } else {
        alert('재생성 실패: ' + result.error);
      }
    } catch (error: any) {
      alert('재생성 중 오류 발생: ' + error.message);
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = '🔄 AI 요약 재생성';
      }
    }
  };

  // 웹훅 단계 렌더링
  const renderWebhookSteps = (webhook: WebhookData) => {
    const completedSteps = webhook.steps.map(s => s.step);

    return (
      <div className="steps-container">
        {STEP_ORDER.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = webhook.currentStep === step;
          let stepClass = 'step ';

          if (isCompleted) {
            stepClass += step;
          } else if (isCurrent) {
            stepClass += 'current ' + step;
          } else {
            stepClass += 'pending';
          }

          return (
            <React.Fragment key={step}>
              <div className={stepClass}>
                {getStepName(step)}
                {isCompleted ? ' ✓' : (isCurrent ? ' ⏳' : '')}
              </div>
              {index < STEP_ORDER.length - 1 && <div className="arrow">→</div>}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // 웹훅 아이템 렌더링
  const renderWebhookItem = (webhook: WebhookData, isProcessing: boolean) => {
    const summary = webhook.data.aiSummary;
    const originalText = webhook.data.text;
    const canRetry = summary && !isProcessing;

    return (
      <div key={webhook.id} className="webhook-item">
        <div className="webhook-header">
          <h3>{webhook.data.roomName || '알 수 없는 방'} - {webhook.data.userName || '알 수 없는 사용자'}</h3>
          <div className="timestamp">{formatTimestamp(webhook.startTime)}</div>
        </div>

        {renderWebhookSteps(webhook)}

        {originalText && (
          <div className="original-content">
            <strong>📝 원본 메시지:</strong><br />
            {truncateText(originalText, 200)}
          </div>
        )}

        {summary && (
          <div className="summary-content">
            <strong>🤖 AI 요약:</strong>
            {canRetry && (
              <button
                className="retry-btn"
                data-webhook-id={webhook.id}
                onClick={() => retryAISummary(webhook.id)}
              >
                🔄 AI 요약 재생성
              </button>
            )}
            <div style={{ marginTop: '10px' }}>{summary}</div>
          </div>
        )}
      </div>
    );
  };

  // 자동 새로고침 토글
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadWebhooks();
  }, []);

  // 자동 새로고침 효과
  useAutoRefresh(loadWebhooks, isAutoRefresh, AUTO_REFRESH_INTERVAL.ADMIN_PAGE);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="header">
            <h1>🔧 Admin - 웹훅 처리 모니터링</h1>
            <div className="no-webhooks">웹훅 데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="header">
          <h1>🔧 Admin - 웹훅 처리 모니터링</h1>
          <p>실시간으로 웹훅 메시지 처리 상태를 확인하고 관리할 수 있습니다.</p>
          <button className="refresh-btn" onClick={loadWebhooks}>
            🔄 새로고침
          </button>
          <button className="refresh-btn" onClick={toggleAutoRefresh}>
            {isAutoRefresh ? '⏹️ 자동 새로고침 정지' : '📡 자동 새로고침 시작'}
          </button>
        </div>

        <div className="webhooks-container">
          {webhooks.processing.length === 0 && webhooks.recent.length === 0 ? (
            <div className="no-webhooks">처리 중인 웹훅이 없습니다.</div>
          ) : (
            <>
              {webhooks.processing.length > 0 && (
                <>
                  <h2 className="processing-indicator">🔄 현재 처리 중인 웹훅</h2>
                  {webhooks.processing.map(webhook => renderWebhookItem(webhook, true))}
                </>
              )}

              {webhooks.recent.length > 0 && (
                <>
                  <h2>📋 최근 처리된 웹훅</h2>
                  {webhooks.recent.map(webhook => renderWebhookItem(webhook, false))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;