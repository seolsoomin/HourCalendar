export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const OVERLAP_CODE = 'SCHEDULE_OVERLAP';

async function request(path, { method = 'GET', body } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'include',
      headers: body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, '서버에 연결할 수 없습니다. 백엔드가 켜져 있는지 확인해 주세요.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const fallback =
      res.status === 401 ? '로그인이 필요합니다. 다시 로그인해 주세요.' : `요청에 실패했습니다. (${res.status})`;
    throw new ApiError(res.status, data?.message || fallback, data?.code);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const query = (params) => new URLSearchParams(params).toString();

export const authApi = {
  checkId: (loginId) => request(`/api/auth/check-id?${query({ loginId })}`),
  signup: (form) => request('/api/auth/signup', { method: 'POST', body: form }),
  login: (loginId, password) => request('/api/auth/login', { method: 'POST', body: { loginId, password } }),
  sendCode: (email, purpose, loginId) =>
    request('/api/auth/email/send', { method: 'POST', body: { email, purpose, loginId } }),
  verifyCode: (email, purpose, code) =>
    request('/api/auth/email/verify', { method: 'POST', body: { email, purpose, code } }),
  findId: (email, code) => request('/api/auth/find-id', { method: 'POST', body: { email, code } }),
  resetPassword: (loginId, email, newPassword) =>
    request('/api/auth/reset-password', { method: 'POST', body: { loginId, email, newPassword } }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

export const userApi = {
  me: () => request('/api/users/me'),
  updateProfile: ({ nickname, birth, pointColor, font }) =>
    request('/api/users/me', {
      method: 'PUT',
      body: { nickname, birth: birth || null, pointColor: pointColor || null, font: font || null },
    }),
  uploadProfileImage: (blob) => {
    const form = new FormData();
    form.append('file', blob, 'profile.jpg');
    return request('/api/users/me/profile-image', { method: 'POST', body: form });
  },
  removeProfileImage: () => request('/api/users/me/profile-image', { method: 'DELETE' }),
  withdraw: (password) => request('/api/users/me/withdraw', { method: 'POST', body: { password } }),
};

export const scheduleApi = {
  month: (year, month) => request(`/api/schedules?${query({ year, month })}`),
  create: (schedule) => request('/api/schedules', { method: 'POST', body: toBody(schedule) }),
  update: (id, schedule) => request(`/api/schedules/${id}`, { method: 'PUT', body: toBody(schedule) }),
  move: (id, date, allowOverlap = false) =>
    request(`/api/schedules/${id}/date`, { method: 'PATCH', body: { date, allowOverlap } }),
  remove: (id) => request(`/api/schedules/${id}`, { method: 'DELETE' }),
};

export const todoApi = {
  day: (date) => request(`/api/todos?${query({ date })}`),
  create: (date, content) => request('/api/todos', { method: 'POST', body: { date, content } }),
  update: (id, changes) => request(`/api/todos/${id}`, { method: 'PATCH', body: changes }),
  remove: (id) => request(`/api/todos/${id}`, { method: 'DELETE' }),
};

export const invitationApi = {
  list: () => request('/api/schedules/invitations'),
  accept: (scheduleId, allowOverlap = false) =>
    request(`/api/schedules/${scheduleId}/accept?${query({ allowOverlap })}`, { method: 'POST' }),
  reject: (scheduleId) => request(`/api/schedules/${scheduleId}/reject`, { method: 'POST' }),
};

export const friendApi = {
  list: () => request('/api/friends'),
  request: (loginId) => request('/api/friends/requests', { method: 'POST', body: { loginId } }),
  received: () => request('/api/friends/requests'),
  accept: (friendshipId) => request(`/api/friends/requests/${friendshipId}/accept`, { method: 'POST' }),
  reject: (friendshipId) => request(`/api/friends/requests/${friendshipId}/reject`, { method: 'POST' }),
  remove: (friendUserId) => request(`/api/friends/${friendUserId}`, { method: 'DELETE' }),
  schedules: (friendUserId, year, month) =>
    request(`/api/friends/${friendUserId}/schedules?${query({ year, month })}`),
};

export const roomApi = {
  list: () => request('/api/rooms'),
  create: (title) => request('/api/rooms', { method: 'POST', body: { title } }),
  join: (roomCode) => request('/api/rooms/join', { method: 'POST', body: { roomCode } }),
  members: (roomId) => request(`/api/rooms/${roomId}/members`),
  remove: (roomId) => request(`/api/rooms/${roomId}`, { method: 'DELETE' }),
  leave: (roomId) => request(`/api/rooms/${roomId}/leave`, { method: 'POST' }),
  freeTime: (roomId, weekStart, { dayStart = '00:00', dayEnd = '24:00', minMinutes = 30 } = {}) =>
    request(`/api/rooms/${roomId}/free-time?${query({ weekStart, dayStart, dayEnd, minMinutes })}`),
  weekSchedules: (roomId, weekStart) => request(`/api/rooms/${roomId}/schedules?${query({ weekStart })}`),
  createGroupSchedule: (roomId, { title, date, endDate, startTime, endTime, memo, memberIds, allowOverlap }) =>
    request(`/api/rooms/${roomId}/schedules`, {
      method: 'POST',
      body: {
        title, date, endDate: endDate || date, startTime, endTime,
        memo: memo || null, memberIds, allowOverlap: Boolean(allowOverlap),
      },
    }),
};

export const chatApi = {
  list: (roomId, { before, after } = {}) => {
    const params = {};
    if (before != null) params.before = before;
    if (after != null) params.after = after;
    const qs = query(params);
    return request(`/api/rooms/${roomId}/messages${qs ? `?${qs}` : ''}`);
  },
  send: (roomId, content) => request(`/api/rooms/${roomId}/messages`, { method: 'POST', body: { content } }),
  read: (roomId, messageId) => request(`/api/rooms/${roomId}/messages/read`, { method: 'POST', body: { messageId } }),
};

export const notificationApi = {
  unread: () => request('/api/notifications'),
  markRead: (id) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),
};

function toBody({ title, date, endDate, startTime, endTime, memo, isSecret, showInCompare, allowOverlap }) {
  return {
    title, date, endDate: endDate || date, startTime, endTime,
    memo: memo || null, isSecret: Boolean(isSecret), showInCompare: showInCompare !== false,
    allowOverlap: Boolean(allowOverlap),
  };
}
