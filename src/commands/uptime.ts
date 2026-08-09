/**
 * 초 단위 시간을 "3일 4시간 12분" 같은 사람이 읽기 쉬운 형태로 변환한다.
 * 값이 0인 단위는 생략하되, 전체가 0이면 "0분"을 표시한다.
 */
export function formatUptime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const totalMinutes = Math.floor(safeSeconds / 60);

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}일`);
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}분`);

  return parts.join(' ');
}
