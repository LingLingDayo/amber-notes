/**
 * 格式化日期对象为指定的格式字符串
 * @param date 日期对象
 * @param formatStr 格式占位字符串，支持 YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, ss, s, A, a
 */
export function formatDate(date: Date, formatStr: string): string {
  if (!formatStr) return '';

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const map: Record<string, string | number> = {
    YYYY: year,
    YY: String(year).slice(-2),
    MM: String(month).padStart(2, '0'),
    M: month,
    DD: String(day).padStart(2, '0'),
    D: day,
    HH: String(hours).padStart(2, '0'),
    H: hours,
    hh: String(hours % 12 || 12).padStart(2, '0'),
    h: hours % 12 || 12,
    mm: String(minutes).padStart(2, '0'),
    m: minutes,
    ss: String(seconds).padStart(2, '0'),
    s: seconds,
    A: hours >= 12 ? 'PM' : 'AM',
    a: hours >= 12 ? '下午' : '上午'
  };

  return formatStr.replace(/Y{2,4}|M{1,2}|D{1,2}|H{1,2}|h{1,2}|m{1,2}|s{1,2}|[Aa]/g, (match) => {
    return String(map[match] !== undefined ? map[match] : match);
  });
}
