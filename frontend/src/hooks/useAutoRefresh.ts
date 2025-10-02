import { useEffect } from 'react';

/**
 * 자동 새로고침 커스텀 훅
 * @param callback - 새로고침 시 실행할 함수
 * @param isEnabled - 자동 새로고침 활성화 여부
 * @param interval - 새로고침 간격 (밀리초)
 */
export const useAutoRefresh = (
  callback: () => void,
  isEnabled: boolean,
  interval: number
) => {
  useEffect(() => {
    if (!isEnabled) return;

    const intervalId = setInterval(callback, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [isEnabled, callback, interval]);
};
