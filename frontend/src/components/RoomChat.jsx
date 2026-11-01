import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useInvitationResponder from '../hooks/useInvitationResponder';
import { formatWhen } from '../utils/dateRange';

const GROUP_GAP_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 60;
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const timeOf = (createdAt) => String(createdAt ?? '').slice(11, 16);
const dayOf = (createdAt) => String(createdAt ?? '').slice(0, 10);
const toMillis = (createdAt) => new Date(String(createdAt ?? '').replace(' ', 'T')).getTime();

function dayLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  if (!y) return '';
  return `${m}월 ${d}일 (${DAY_NAMES[new Date(y, m - 1, d).getDay()]})`;
}

const displayName = (m) => m.nickname ?? '탈퇴한 사용자';

function ChatAvatar({ m }) {
  const [broken, setBroken] = useState(false);
  const src = m.userId != null && !broken ? m.profileImage : null;
  return (
    <div className="chat-avatar" aria-hidden="true">
      {src ? (
        <img className="profile-img" src={src} alt="" onError={() => setBroken(true)} />
      ) : (
        <div className="profile-img-icon" data-testid="chat-avatar-icon" />
      )}
    </div>
  );
}

export function isComposingEnter(e) {
  return e.nativeEvent?.isComposing || e.keyCode === 229;
}

function buildRows(messages, currentUserId) {
  const rows = [];
  messages.forEach((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    if (!prev || dayOf(prev.createdAt) !== dayOf(m.createdAt)) {
      rows.push({ kind: 'day', key: `day-${m.id}`, label: dayLabel(dayOf(m.createdAt)) });
    }
    if (m.type !== 'TEXT') {
      rows.push({ kind: m.type, key: m.id, m });
      return;
    }
    const sameGroup = (a, b) =>
      a && b && a.type === 'TEXT' && b.type === 'TEXT' && a.userId === b.userId &&
      dayOf(a.createdAt) === dayOf(b.createdAt) && Math.abs(toMillis(b.createdAt) - toMillis(a.createdAt)) < GROUP_GAP_MS;
    rows.push({
      kind: 'TEXT',
      key: m.id,
      m,
      mine: m.userId != null && m.userId === currentUserId,
      showName: !sameGroup(prev, m),
      showTime: !sameGroup(m, next),
    });
  });
  return rows;
}

function InviteCard({ m, currentUserId, invitation, responder, onAccept, onReject }) {
  const { busyId, error, overlap, respond } = responder;
  const scheduleId = m.refId;
  const busy = busyId === scheduleId;
  const mine = m.userId != null && m.userId === currentUserId;

  return (
    <div className="chat-card">
      <div className="chat-card-info">
        <div className="chat-card-label">다인 일정 초대 · {displayName(m)}</div>
        <div className="chat-card-title">{m.content}</div>
        <div className="chat-card-sub">{formatWhen(m)}</div>
      </div>
      {invitation ? (
        <div className="chat-card-actions">
          <button type="button" className="cyber-button btn-sm" disabled={busy} onClick={() => respond(onAccept, scheduleId)}>
            수락
          </button>
          <button type="button" className="cyber-button btn-sm btn-danger" disabled={busy}
            onClick={() => respond(onReject, scheduleId)}>
            거절
          </button>
        </div>
      ) : (
        mine && <div className="chat-card-sub chat-card-note">내가 보낸 초대예요. 모두 수락하면 확정돼요.</div>
      )}
      {overlap?.scheduleId === scheduleId && (
        <div className="form-warning" role="alert">
          <p className="form-warning-text">{overlap.message}</p>
          <p className="form-warning-text">겹치는 것을 확인했다면 그대로 수락할 수 있습니다.</p>
          <div className="form-warning-actions">
            <button type="button" className="cyber-button btn-sm" disabled={busy} onClick={() => respond(onAccept, scheduleId, true)}>
              확인했습니다
            </button>
          </div>
        </div>
      )}
      {error?.scheduleId === scheduleId && <div className="form-error" role="alert">{error.message}</div>}
    </div>
  );
}

export default function RoomChat({
  className = '',
  messages,
  loaded,
  hasMore,
  loadingOlder,
  currentUserId,
  invitations,
  headerExtra,
  notice,
  onLoadOlder,
  onSend,
  onAcceptInvitation,
  onRejectInvitation,
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [showNew, setShowNew] = useState(false);
  const responder = useInvitationResponder();

  const listRef = useRef(null);
  const atBottomRef = useRef(true);
  const prevRef = useRef({ firstId: null, lastId: null, height: 0 });

  const firstId = messages[0]?.id ?? null;
  const lastId = messages[messages.length - 1]?.id ?? null;
  const lastMine = messages[messages.length - 1]?.userId === currentUserId;

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const prev = prevRef.current;
    if (prev.firstId != null && firstId !== prev.firstId && lastId === prev.lastId) {
      el.scrollTop += el.scrollHeight - prev.height;
    } else if (lastId !== prev.lastId) {
      if (prev.lastId == null || atBottomRef.current || lastMine) {
        el.scrollTop = el.scrollHeight;
        atBottomRef.current = true;
        setShowNew(false);
      } else {
        setShowNew(true);
      }
    }
    prevRef.current = { firstId, lastId, height: el.scrollHeight };
  }, [firstId, lastId, lastMine]);

  useEffect(() => {
    const el = listRef.current;
    if (el) prevRef.current.height = el.scrollHeight;
  });

  const handleScroll = () => {
    const el = listRef.current;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    if (atBottomRef.current) setShowNew(false);
  };

  const scrollToBottom = () => {
    const el = listRef.current;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setShowNew(false);
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError('');
    try {
      await onSend(content);
      setDraft('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' || e.shiftKey || isComposingEnter(e)) return;
    e.preventDefault();
    submit();
  };

  const pendingIds = new Set((invitations ?? []).map((i) => i.scheduleId));
  const rows = buildRows(messages, currentUserId);

  return (
    <section className={`box-border chat-panel ${className}`} aria-label="대화">
      <div className="chat-header">
        <span className="section-label chat-title">대화</span>
        {headerExtra}
      </div>

      <div className="chat-list" ref={listRef} onScroll={handleScroll} role="log" aria-live="polite">
        {hasMore && (
          <button type="button" className="text-button chat-older" onClick={onLoadOlder} disabled={loadingOlder}>
            {loadingOlder ? '불러오는 중...' : '이전 메시지 보기'}
          </button>
        )}
        {loaded && messages.length === 0 && <p className="empty-text chat-empty">첫 메시지를 보내 보세요.</p>}

        {rows.map((row) => {
          if (row.kind === 'day') {
            return <div key={row.key} className="chat-day">{row.label}</div>;
          }
          if (row.kind === 'SYSTEM') {
            return <div key={row.key} className="chat-system">{row.m.content}</div>;
          }
          if (row.kind === 'INVITE') {
            return (
              <InviteCard
                key={row.key}
                m={row.m}
                currentUserId={currentUserId}
                invitation={pendingIds.has(row.m.refId)}
                responder={responder}
                onAccept={onAcceptInvitation}
                onReject={onRejectInvitation}
              />
            );
          }
          return (
            <div key={row.key} className={`chat-row ${row.mine ? 'is-mine' : ''} ${row.showName ? 'is-first' : ''}`}>
              {!row.mine && <div className="chat-avatar-col">{row.showName && <ChatAvatar m={row.m} />}</div>}
              <div className="chat-row-body">
                {row.showName && !row.mine && <div className="chat-name">{displayName(row.m)}</div>}
                <div className="chat-bubble-line">
                  <div className="chat-bubble">{row.m.content}</div>
                  {row.showTime && <span className="chat-time">{timeOf(row.m.createdAt)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showNew && (
        <button type="button" className="cyber-button btn-sm chat-new" onClick={scrollToBottom}>
          새 메시지 ↓
        </button>
      )}

      {notice && <p className="hint-text chat-notice">{notice}</p>}
      {error && <div className="form-error chat-error" role="alert">{error}</div>}

      <div className="chat-input-row">
        <textarea
          className="cyber-input chat-input"
          rows={1}
          maxLength={1000}
          placeholder="메시지 입력"
          aria-label="메시지 입력"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="cyber-button chat-send" onClick={submit} disabled={sending || !draft.trim()}>
          보내기
        </button>
      </div>
    </section>
  );
}
