import React from 'react';
import ModalShell from './ModalShell';
import useInvitationResponder from '../hooks/useInvitationResponder';
import { formatWhen } from '../utils/dateRange';

const TYPE_LABEL = {
  FRIEND_REQUEST: '친구 요청',
  SCHEDULE_INVITE: '일정 초대',
  SCHEDULE_CANCELED: '일정 취소',
};

function formatDateTime(value) {
  if (!value) return '';
  const [date, time = ''] = String(value).split('T');
  const [, m, d] = date.split('-');
  return `${Number(m)}/${Number(d)} ${time.slice(0, 5)}`;
}

export default function NotificationPanel({ invitations, notifications, onAccept, onReject, onGoRequests, onClose }) {
  const { busyId, error, overlap, respond } = useInvitationResponder();

  const isEmpty = invitations.length === 0 && notifications.length === 0;

  return (
    <ModalShell title="알림" onClose={onClose} className="notification-modal">
      {isEmpty && <p className="empty-text">새 알림이 없습니다.</p>}

      {invitations.length > 0 && (
        <>
          <div className="section-label">응답이 필요한 일정 초대</div>
          <ul className="request-list">
            {invitations.map((inv) => (
              <li key={inv.scheduleId} className="box-inner invitation-item">
                <div className="invitation-title">{inv.title}</div>
                <div className="request-sub">
                  {formatWhen(inv)} · [{inv.roomTitle}] {inv.ownerNickname}님의 초대
                </div>
                {inv.memo && <div className="request-sub">메모: {inv.memo}</div>}
                <div className="request-actions">
                  <button type="button" className="cyber-button btn-sm" disabled={busyId === inv.scheduleId}
                    onClick={() => respond(onAccept, inv.scheduleId)}>
                    수락
                  </button>
                  <button type="button" className="cyber-button btn-sm btn-danger" disabled={busyId === inv.scheduleId}
                    onClick={() => respond(onReject, inv.scheduleId)}>
                    거절
                  </button>
                </div>
                {overlap?.scheduleId === inv.scheduleId && (
                  <div className="form-warning" role="alert">
                    <p className="form-warning-text">{overlap.message}</p>
                    <p className="form-warning-text">겹치는 것을 확인했다면 그대로 수락할 수 있습니다.</p>
                    <div className="form-warning-actions">
                      <button type="button" className="cyber-button btn-sm" disabled={busyId === inv.scheduleId}
                        onClick={() => respond(onAccept, inv.scheduleId, true)}>
                        확인했습니다
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {error && <div className="form-error" role="alert">{error.message}</div>}
        </>
      )}

      {notifications.length > 0 && (
        <>
          <div className="section-label notification-section">새 알림</div>
          <ul className="notification-list">
            {notifications.map((n) => (
              <li key={n.notificationId} className="notification-item">
                <span className="secret-badge">{TYPE_LABEL[n.notiType] ?? '알림'}</span>
                <span className="notification-message">{n.message}</span>
                <span className="request-sub">{formatDateTime(n.createdAt)}</span>
                {n.notiType === 'FRIEND_REQUEST' && (
                  <button type="button" className="text-button" onClick={onGoRequests}>
                    보러 가기
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="actions actions--top">
        <button type="button" className="cyber-button" onClick={onClose} autoFocus>
          닫기
        </button>
      </div>
    </ModalShell>
  );
}
