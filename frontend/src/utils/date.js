const pad = (n) => String(n).padStart(2, '0');

export const toDateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

export const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
