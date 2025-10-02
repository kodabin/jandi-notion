/**
 * 타임스탬프를 한국어 형식으로 포맷팅
 * @param timestamp - ISO 형식의 타임스탬프
 * @returns 포맷된 시간 문자열
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('ko-KR');
};

/**
 * 긴 텍스트를 지정된 길이로 자르고 말줄임표 추가
 * @param text - 원본 텍스트
 * @param maxLength - 최대 길이
 * @returns 잘린 텍스트
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
