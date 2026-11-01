import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MobileTopBar from './MobileTopBar';
import GroupScheduleModal from './GroupScheduleModal';
import RoomChat from './RoomChat';
import useRoomChat from '../hooks/useRoomChat';
import { toDateKey } from '../utils/date';
import { chatApi, roomApi } from '../api/client';
import { addDays, scheduleDayKeys, segmentOnDay } from '../utils/dateRange';

const READ_DELAY_MS = 400;


const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDays(offset) {
  const t = new Date();
  const sundayDate = t.getDate() - t.getDay() + offset * 7;

  return DAY_NAMES.map((dayName, i) => {
    const d = new Date(t.getFullYear(), t.getMonth(), sundayDate + i);
    return {
      key: toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      dayName,
      day: d.getDate(),
      dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
    };
  });
}

const todayKey = () => {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
};

function buildTimeline(dayKey, slots, schedules) {
  const items = [
    ...slots.map((s) => ({ type: 'free', key: `free-${s.start}`, start: s.start, end: s.end })),
    ...schedules.map((s) => {
      const seg = segmentOnDay(s, dayKey);
      return { type: 'schedule', key: `sch-${s.id}`, start: seg.start, end: seg.end, schedule: s };
    }),
  ];
  return items.sort((a, b) => a.start.localeCompare(b.start) || (a.type === 'schedule' ? -1 : 1));
}

function ScheduleBlock({ schedule, start, end }) {
  const classes = ['room-schedule', schedule.mine ? 'is-mine' : 'is-other'];
  if (schedule.status === 'PENDING') classes.push('is-pending');
  const who = schedule.mine ? null : schedule.members.join(', ');
  const title = !schedule.mine && schedule.isSecret ? '(비공개 일정)' : schedule.title;

  return (
    <div className={classes.join(' ')} title={`${start}–${end} ${who ? `[${who}] ` : ''}${title}`}>
      <span className="room-schedule-line">
        <span className="room-schedule-time">{start}</span>
        <span className="room-schedule-title">{title}</span>
      </span>
      {who && <span className="room-schedule-who">{who}</span>}
    </div>
  );
}

export default function CompareRoom({
  room,
  currentUserId,
  invitations,
  onToggleSidebar,
  onError,
  onScheduleChanged,
  onInboxChanged,
  onRoomRead,
  onAcceptInvitation,
  onRejectInvitation,
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const weekStart = days[0].key;
  const today = todayKey();

  const [members, setMembers] = useState([]);
  const [freeTime, setFreeTime] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [groupModal, setGroupModal] = useState(null);

  const handleRoomEvent = useCallback(() => {
    setReloadKey((k) => k + 1);
    onScheduleChanged?.();
    onInboxChanged?.();
  }, [onScheduleChanged, onInboxChanged]);

  const chat = useRoomChat(room.roomId, { onRoomEvent: handleRoomEvent, onError });
  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastId = lastMessage?.id ?? null;

  const readSentRef = useRef(0);

  useEffect(() => {
    if (lastId == null || lastId <= readSentRef.current) return undefined;
    const timer = setTimeout(() => {
      readSentRef.current = lastId;
      chatApi
        .read(room.roomId, lastId)
        .then(() => onRoomRead?.(room.roomId))
        .catch(() => {
          readSentRef.current = 0;
        });
    }, READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [lastId, room.roomId, onRoomRead]);

  useEffect(() => {
    let ignore = false;
    roomApi
      .members(room.roomId)
      .then((list) => {
        if (!ignore) setMembers(list);
      })
      .catch((err) => {
        if (!ignore) onError(err);
      });
    return () => {
      ignore = true;
    };
  }, [room.roomId, reloadKey, onError]);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    Promise.all([roomApi.freeTime(room.roomId, weekStart), roomApi.weekSchedules(room.roomId, weekStart)])
      .then(([free, list]) => {
        if (ignore) return;
        setFreeTime(free);
        setSchedules(list);
      })
      .catch((err) => {
        if (!ignore) onError(err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [room.roomId, weekStart, reloadKey, onError]);

  const timelineByDate = useMemo(() => {
    const slotsByDate = new Map((freeTime?.days ?? []).map((d) => [d.date, d.slots]));
    const schedulesByDate = new Map();
    for (const s of schedules) {
      for (const key of scheduleDayKeys(s)) {
        if (!schedulesByDate.has(key)) schedulesByDate.set(key, []);
        schedulesByDate.get(key).push(s);
      }
    }
    const map = new Map();
    for (const d of days) {
      map.set(d.key, buildTimeline(d.key, slotsByDate.get(d.key) ?? [], schedulesByDate.get(d.key) ?? []));
    }
    return map;
  }, [days, freeTime, schedules]);

  const others = members.filter((m) => m.userId !== currentUserId);
  const canCompare = members.length >= 2;

  const handleCreateGroup = async (form) => {
    await roomApi.createGroupSchedule(room.roomId, form);
    setReloadKey((k) => k + 1);
    onScheduleChanged?.();
  };

  const acceptInvitation = async (scheduleId, allowOverlap) => {
    await onAcceptInvitation(scheduleId, allowOverlap);
    setReloadKey((k) => k + 1);
  };

  const memberChips = (
    <div className="member-chips">
      {members.map((m) => (
        <span key={m.userId} className={`member-chip ${m.userId === room.hostId ? 'is-host' : ''}`}>
          {m.nickname}
        </span>
      ))}
    </div>
  );

  return (
    <>
      <MobileTopBar onToggleSidebar={onToggleSidebar} />

      <section className="box-border compare-container">
        <div className="calendar-header">
          <button type="button" className="cyber-button btn-sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label="이전 주">
            &lt;
          </button>
          <div className="compare-title">
            <span className="calendar-title">{room.title}</span>
            <span className="compare-range">
              {days[0].dateStr} – {days[6].dateStr}
              {weekOffset !== 0 && (
                <button type="button" className="text-button" onClick={() => setWeekOffset(0)}>
                  이번 주
                </button>
              )}
            </span>
          </div>
          <button type="button" className="cyber-button btn-sm" onClick={() => setWeekOffset((w) => w + 1)} aria-label="다음 주">
            &gt;
          </button>
        </div>

        <div className="calendar-table">
          <div className="weekday-row">
            {days.map((d) => (
              <div key={d.key}>{d.dayName}</div>
            ))}
          </div>

          <div className="compare-week-grid">
            {days.map((d, i) => {
              const timeline = timelineByDate.get(d.key) ?? [];
              const hasFree = timeline.some((item) => item.type === 'free');
              return (
                <div key={d.key} className={`compare-day-cell ${d.key === today ? 'today' : ''}`}>
                  <span className="cell-date">{i === 0 || d.day === 1 ? d.dateStr : d.day}</span>

                  <div className="day-timeline">
                    {timeline.map((item) =>
                      item.type === 'free' ? (
                        canCompare && (
                          <button
                            type="button"
                            key={item.key}
                            className="free-slot"
                            onClick={() =>
                              setGroupModal(
                                item.end === '24:00'
                                  ? { date: d.key, endDate: addDays(d.key, 1), startTime: item.start, endTime: '00:00' }
                                  : { date: d.key, endDate: d.key, startTime: item.start, endTime: item.end }
                              )
                            }
                            title="이 시간으로 다인 일정 추가"
                          >
                            {item.start}–{item.end}
                          </button>
                        )
                      ) : (
                        <ScheduleBlock key={item.key} schedule={item.schedule} start={item.start} end={item.end} />
                      )
                    )}
                    {!loading && canCompare && !hasFree && <span className="free-slot-empty">빈 시간 없음</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <RoomChat
        className="room-chat-box"
        messages={chat.messages}
        loaded={chat.loaded}
        hasMore={chat.hasMore}
        loadingOlder={chat.loadingOlder}
        currentUserId={currentUserId}
        invitations={invitations}
        headerExtra={memberChips}
        notice={canCompare ? null : '일정을 비교하려면 2명 이상이 필요합니다. 방 코드를 공유해 친구를 초대하세요.'}
        onLoadOlder={chat.loadOlder}
        onSend={chat.send}
        onAcceptInvitation={acceptInvitation}
        onRejectInvitation={onRejectInvitation}
      />

      {groupModal && (
        <GroupScheduleModal
          roomTitle={room.title}
          members={others}
          initial={groupModal}
          onClose={() => setGroupModal(null)}
          onSubmit={handleCreateGroup}
        />
      )}
    </>
  );
}
