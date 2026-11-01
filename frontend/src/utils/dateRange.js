const pad = (n) => String(n).padStart(2, '0');

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function formatMD(key) {
  const [, m, d] = key.split('-').map(Number);
  return `${m}/${d}`;
}

export const endDateOf = (s) => s.endDate || s.date;

export const isMultiDay = (s) => endDateOf(s) !== s.date;

export function scheduleDayKeys(s) {
  let last = endDateOf(s);
  if (last > s.date && s.endTime === '00:00') last = addDays(last, -1);
  const keys = [];
  for (let k = s.date; k <= last && keys.length < 40; k = addDays(k, 1)) keys.push(k);
  return keys;
}

export function segmentOnDay(s, dayKey) {
  const start = dayKey === s.date ? s.startTime : '00:00';
  const end = dayKey === endDateOf(s) ? s.endTime : '24:00';
  return { start, end: end === '00:00' && dayKey !== s.date ? '24:00' : end };
}

export function formatRange(s) {
  if (!isMultiDay(s)) return `${s.startTime}–${s.endTime}`;
  return `${formatMD(s.date)} ${s.startTime} – ${formatMD(endDateOf(s))} ${s.endTime}`;
}

export function buildSundayMonthCells(year, month) {
  const leading = new Date(year, month - 1, 1).getDay();
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array(leading).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatWhen(s) {
  return isMultiDay(s) ? formatRange(s) : `${formatMD(s.date)} ${formatRange(s)}`;
}
