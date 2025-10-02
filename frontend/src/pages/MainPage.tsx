import React, { useState, useEffect } from 'react';
import { messageApi, logApi } from '../services/api';
import { MESSAGE_COLORS, AUTO_REFRESH_INTERVAL } from '../constants';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { formatTimestamp } from '../utils/formatters';
import type { Log } from '../types';
import './MainPage.css';

const MainPage: React.FC = () => {
  const [messageBody, setMessageBody] = useState('');
  const [messageColor, setMessageColor] = useState('#FAC11B');
  const [connectInfo, setConnectInfo] = useState('');
  const [sendResult, setSendResult] = useState('');
  const [aiSummaryPreview, setAiSummaryPreview] = useState(false);
  const [summaryResult, setSummaryResult] = useState('');
  const [currentSummary, setCurrentSummary] = useState('');
  const [logs, setLogs] = useState<Log[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);

  // 환경 정보
  const port = process.env.NODE_ENV === 'development' ? '3000' : window.location.port;
  const serverUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : window.location.origin;

  // 로그 불러오기
  const loadLogs = async () => {
    try {
      const logsData = await logApi.getLogs();
      setLogs(logsData);
    } catch (error) {
      console.error('로그 로딩 실패:', error);
    }
  };

  // 메시지 전송
  const sendMessage = async (messageText: string) => {
    setSendResult('<div style="color: blue;">메시지 전송 중...</div>');

    try {
      const result = await messageApi.sendToJandi({
        body: messageText,
        connectColor: messageColor,
        connectInfo: connectInfo || undefined,
      });

      if (result.success) {
        setSendResult(`<div style="color: green;">✅ ${result.message}</div>`);
        setMessageBody('');
        setConnectInfo('');
        setAiSummaryPreview(false);
        loadLogs();
      } else {
        setSendResult(`<div style="color: red;">❌ ${result.error}</div>`);
      }
    } catch (error: any) {
      setSendResult(`<div style="color: red;">❌ 전송 실패: ${error.message}</div>`);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageBody.trim()) {
      setSendResult('<div style="color: red;">메시지 내용을 입력해주세요.</div>');
      return;
    }

    await sendMessage(messageBody);
  };

  // AI 요약 생성
  const handleAISummary = async () => {
    if (!messageBody.trim()) {
      setSendResult('<div style="color: red;">요약할 메시지 내용을 입력해주세요.</div>');
      return;
    }

    setSummaryResult('🤖 AI가 요약을 생성하고 있습니다...');
    setAiSummaryPreview(true);
    setSendResult('<div style="color: blue;">AI 요약 생성 중...</div>');

    try {
      const result = await messageApi.testAISummary(messageBody);

      if (result.success) {
        setSummaryResult(result.summary);
        setSendResult('<div style="color: green;">✅ AI 요약 완료! 확인 후 전송하세요.</div>');
        setCurrentSummary(result.summary);
      } else {
        setSummaryResult(`요약 생성에 실패했습니다: ${result.message}`);
        setSendResult(`<div style="color: red;">❌ ${result.message}</div>`);
      }
    } catch (error: any) {
      setSummaryResult('요약 생성 중 오류가 발생했습니다.');
      setSendResult(`<div style="color: red;">❌ 요약 생성 실패: ${error.message}</div>`);
    }
  };

  // 요약된 내용으로 전송
  const handleSendSummary = async () => {
    if (currentSummary) {
      await sendMessage(currentSummary);
    }
  };

  // 요약 취소
  const handleCancelSummary = () => {
    setAiSummaryPreview(false);
    setSendResult('');
    setCurrentSummary('');
  };

  // 자동 새로고침 토글
  const toggleAutoRefresh = () => {
    setIsAutoRefresh(!isAutoRefresh);
  };

  // 로그 내용 렌더링
  const renderLogContent = (log: Log) => {
    if (log.eventType === 'ai_summary_generated') {
      return (
        <div className="ai-summary">
          <strong>🤖 AI 요약:</strong> {log.data.summary}<br />
          <small>작성자: {log.data.author || '알 수 없음'} | 방: {log.data.room || '알 수 없음'}</small><br />
          <details style={{ marginTop: '5px' }}>
            <summary>원본 메시지 보기</summary>
            <div style={{ background: '#fff', padding: '5px', marginTop: '5px', borderRadius: '3px' }}>
              {log.data.originalText}
            </div>
          </details>
        </div>
      );
    } else {
      return <pre>{JSON.stringify(log.data, null, 2)}</pre>;
    }
  };

  // 컴포넌트 마운트 시 로그 로드
  useEffect(() => {
    loadLogs();
  }, []);

  // 자동 새로고침 효과
  useAutoRefresh(loadLogs, isAutoRefresh, AUTO_REFRESH_INTERVAL.MAIN_PAGE);

  return (
    <div className="main-page">
      <h1>🚀 잔디-노션 Webhook 서버</h1>
      <p className="status">✅ 서버가 정상적으로 실행중입니다!</p>

      <div className="info">
        <h3>설정 상태:</h3>
        <ul>
          <li>포트: {port}</li>
          <li>서버 URL: {serverUrl}</li>
        </ul>
      </div>

      <div className="info">
        <h3>Webhook URL:</h3>
        <code>{serverUrl}/webhook/jandi</code>
      </div>

      <div className="info">
        <h3>💬 잔디로 메시지 보내기:</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ margin: '10px 0' }}>
            <label htmlFor="messageBody">메시지 내용:</label><br />
            <textarea
              id="messageBody"
              rows={3}
              style={{ width: '100%', padding: '5px' }}
              placeholder="잔디로 보낼 메시지를 입력하세요..."
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
            />
          </div>
          <div style={{ margin: '10px 0' }}>
            <label htmlFor="messageColor">색상:</label>
            <select
              id="messageColor"
              style={{ padding: '5px' }}
              value={messageColor}
              onChange={(e) => setMessageColor(e.target.value)}
            >
              {MESSAGE_COLORS.map(color => (
                <option key={color.value} value={color.value}>{color.label}</option>
              ))}
            </select>
          </div>
          <div style={{ margin: '10px 0' }}>
            <label htmlFor="connectInfo">추가 정보 (선택사항):</label><br />
            <input
              type="text"
              id="connectInfo"
              style={{ width: '100%', padding: '5px' }}
              placeholder="추가 정보나 링크"
              value={connectInfo}
              onChange={(e) => setConnectInfo(e.target.value)}
            />
          </div>
          <div style={{ margin: '10px 0' }}>
            <button type="submit">잔디로 메시지 보내기</button>
            <button
              type="button"
              onClick={handleAISummary}
              style={{ background: '#9c27b0', marginLeft: '10px' }}
            >
              🤖 AI 요약해서 보내기
            </button>
          </div>
        </form>

        {aiSummaryPreview && (
          <div style={{ marginTop: '10px' }}>
            <div className="ai-summary-preview">
              <strong>🤖 AI 요약 결과:</strong>
              <div style={{ margin: '5px 0', fontStyle: 'italic' }}>{summaryResult}</div>
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleSendSummary} style={{ background: '#9c27b0' }}>
                  요약된 내용으로 전송
                </button>
                <button onClick={handleCancelSummary} style={{ background: '#666', marginLeft: '10px' }}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: sendResult }} />
      </div>

      <div className="info">
        <h3>실시간 로그 모니터링:</h3>
        <button onClick={loadLogs}>로그 새로고침</button>
        <button onClick={toggleAutoRefresh} style={{ marginLeft: '10px' }}>
          {isAutoRefresh ? '자동 새로고침 정지' : '자동 새로고침 시작'}
        </button>
        <div className="logs-container">
          {logs.length === 0 ? (
            <div className="log-entry">아직 로그가 없습니다.</div>
          ) : (
            logs.slice().reverse().map((log, index) => {
              const time = formatTimestamp(log.timestamp);
              const eventClass = log.eventType ? log.eventType.replace('_', '-') : 'default';

              return (
                <div key={index} className={`log-entry ${eventClass}`}>
                  <strong>[{time}] {log.eventType || 'unknown'}</strong><br />
                  {renderLogContent(log)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;