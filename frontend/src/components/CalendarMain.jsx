import React, { useEffect, useMemo, useState } from 'react';
import MobileTopBar from './MobileTopBar';
import useScheduleDrag from '../hooks/useScheduleDrag';
import { getDaysInMonth, toDateKey } from '../utils/date';
import { buildSundayMonthCells, formatRange, isMultiDay, scheduleDayKeys, segmentOnDay } from '../utils/dateRange';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const EMPTY = [];
const MAX_ROWS = 3;
const MAX_BAR_LANES = 2;

function layoutMonth(cells, year, month, schedules) {
  const indexOfKey = new Map();
  cells.forEach((d, idx) => {
    if (d !== null) indexOfKey.set(toDateKey(year, month, d), idx);
  });

  const segments = [];
  const singlesByDate = new Map();
  for (const s of schedules) {
    const keys = scheduleDayKeys(s);
    if (keys.length === 1) {
      if (!singlesByDate.has(keys[0])) singlesByDate.set(keys[0], []);
      singlesByDate.get(keys[0]).push(s);
      continue;
    }
    let current = null;
    for (const key of keys) {
      const idx = indexOfKey.get(key);
      if (idx === undefined) continue;
      const row = Math.floor(idx / 7);
      const col = idx % 7;
      if (current && current.row === row && current.colEnd === col - 1) {
        current.colEnd = col;
        current.lastKey = key;
      } else {
        current = { s, row, colStart: col, colEnd: col, firstKey: key, lastKey: key };
        segments.push(current);
      }
    }
  }
  for (const seg of segments) {
    seg.isStart = seg.firstKey === seg.s.date;
    seg.isEnd = seg.lastKey === scheduleDayKeys(seg.s).at(-1);
  }

  segments.sort((a, b) => a.row - b.row || a.colStart - b.colStart || b.colEnd - a.colEnd);
  const laneEnds = new Map();
  for (const seg of segments) {
    const ends = laneEnds.get(seg.row) ?? [];
    let lane = ends.findIndex((end) => end < seg.colStart);
    if (lane === -1) lane = ends.length;
    ends[lane] = seg.colEnd;
    laneEnds.set(seg.row, ends);
    seg.lane = lane;
  }
  const bars = segments.filter((seg) => seg.lane < MAX_BAR_LANES);

  const barLanesByDate = new Map();
  for (const seg of bars) {
    for (let col = seg.colStart; col <= seg.colEnd; col++) {
      const key = toDateKey(year, month, cells[seg.row * 7 + col]);
      barLanesByDate.set(key, Math.max(barLanesByDate.get(key) ?? 0, seg.lane + 1));
    }
  }

  for (const list of singlesByDate.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const hiddenBarsByDate = new Map();
  for (const seg of segments) {
    if (seg.lane < MAX_BAR_LANES) continue;
    for (let col = seg.colStart; col <= seg.colEnd; col++) {
      const d = cells[seg.row * 7 + col];
      const key = toDateKey(year, month, d);
      hiddenBarsByDate.set(key, (hiddenBarsByDate.get(key) ?? 0) + 1);
    }
  }

  return { bars, barLanesByDate, singlesByDate, hiddenBarsByDate };
}

function getToday() {
  const t = new Date();
  return { year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() };
}

function getPermissions(schedule, currentUserId, readOnly) {
  const isOwner = !readOnly && (currentUserId == null || schedule.ownerId == null || schedule.ownerId === currentUserId);
  const isPersonal = schedule.roomId == null;
  return { canEdit: isOwner && isPersonal, canDelete: isOwner, canDrag: isOwner && isPersonal };
}

const PARTICIPANT_LABEL = { HOST: '주최', PENDING: '응답 대기', REJECTED: '거절' };

function participantText(schedule, currentUserId) {
  const others = (schedule.participants ?? []).filter((p) => p.userId !== currentUserId);
  return others
    .map((p) => (PARTICIPANT_LABEL[p.status] ? `${p.nickname}(${PARTICIPANT_LABEL[p.status]})` : p.nickname))
    .join(', ');
}

function ScheduleItem({ schedule, currentUserId, perms, isDragging, onDragStart, onEdit, onDelete }) {
  const memo = schedule.memo?.trim();
  const withWhom = participantText(schedule, currentUserId);
  const summary = (
    <>
      {perms.canDrag && (
        <span
          className="drag-handle"
          onPointerDown={(e) => onDragStart(e, schedule)}
          title="달력의 다른 날짜로 끌어서 옮기기"
          aria-hidden="true"
        >
          ⠿
        </span>
      )}
      <span className={`schedule-time ${isMultiDay(schedule) ? 'is-multi' : ''}`}>{formatRange(schedule)}</span>
      <span className="schedule-title">{schedule.title}</span>
      {schedule.status === 'PENDING' && <span className="secret-badge">응답 대기</span>}
      {schedule.roomId != null && schedule.status !== 'PENDING' && <span className="secret-badge">다인</span>}
      {schedule.isSecret && <span className="secret-badge">비공개</span>}
    </>
  );

  return (
    <li className={`schedule-item ${isDragging ? 'is-drag-source' : ''}`}>
      {memo || withWhom ? (
        <details className="schedule-details">
          <summary className="schedule-summary">
            {summary}
            <span className="memo-badge">{memo ? '메모' : '함께'}</span>
          </summary>
          {memo && <p className="schedule-memo">{memo}</p>}
          {withWhom && (
            <p className="schedule-with">
              <span className="schedule-with-label">함께하는 사람</span>
              {withWhom}
            </p>
          )}
        </details>
      ) : (
        <div className="schedule-details schedule-summary">{summary}</div>
      )}

      {(perms.canEdit || perms.canDelete) && (
        <div className="schedule-actions">
          {perms.canEdit && (
            <button type="button" className="text-button" onClick={onEdit} aria-label={`${schedule.title} 수정`}>
              수정
            </button>
          )}
          {perms.canDelete && (
            <button type="button" className="text-button text-button--danger" onClick={onDelete} aria-label={`${schedule.title} 삭제`}>
              삭제
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export default function CalendarMain({
  ownerName,
  isFriendView = false,
  currentUserId,
  schedules = EMPTY,
  onOpenAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onMoveSchedule,
  onMonthChange,
  onToggleSidebar,
  extraActions,
}) {
  const [cursor, setCursor] = useState(getToday);
  const { year, month, day } = cursor;

  useEffect(() => {
    onMonthChange?.(year, month);
  }, [year, month, onMonthChange]);

  const todayKey = useMemo(() => {
    const t = getToday();
    return toDateKey(t.year, t.month, t.day);
  }, []);

  const cells = useMemo(() => buildSundayMonthCells(year, month), [year, month]);
  const totalWeeks = cells.length / 7;

  const schedulesByDate = useMemo(() => {
    const map = new Map();
    for (const s of schedules) {
      for (const key of scheduleDayKeys(s)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
      }
    }
    for (const [key, list] of map) {
      list.sort((a, b) => segmentOnDay(a, key).start.localeCompare(segmentOnDay(b, key).start));
    }
    return map;
  }, [schedules]);

  const layout = useMemo(() => layoutMonth(cells, year, month, schedules), [cells, year, month, schedules]);

  const selectedKey = toDateKey(year, month, day);
  const daySchedules = schedulesByDate.get(selectedKey) ?? EMPTY;

  const moveMonth = (delta) => {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month - 1 + delta, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      return { year: y, month: m, day: Math.min(prev.day, getDaysInMonth(y, m)) };
    });
  };

  const selectDay = (d) => setCursor((prev) => ({ ...prev, day: d }));

  const { drag, ghostRef, ghostPos, startDrag } = useScheduleDrag((schedule, dateKey) => {
    onMoveSchedule?.(schedule.id, dateKey);
    selectDay(Number(dateKey.slice(8)));
  });
  const dragEnabled = !isFriendView && Boolean(onMoveSchedule);
  const draggingId = drag?.schedule.id;
  const permsOf = (s) => {
    const perms = getPermissions(s, currentUserId, isFriendView);
    return { ...perms, canDrag: perms.canDrag && dragEnabled };
  };

  return (
    <>
      <MobileTopBar onToggleSidebar={onToggleSidebar} />

      <section className="box-border calendar-main">
        <div className="calendar-header">
          <button type="button" className="cyber-button btn-sm" onClick={() => moveMonth(-1)} aria-label="이전 달">
            &lt;
          </button>
          <span className="calendar-title">
            {ownerName && `${ownerName}님의 `}
            {year}년 {month}월
          </span>
          <button type="button" className="cyber-button btn-sm" onClick={() => moveMonth(1)} aria-label="다음 달">
            &gt;
          </button>
        </div>

        <div className="calendar-table">
          <div className="weekday-row">
            {WEEKDAYS.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>

          <div className="calendar-grid" style={{ gridTemplateRows: `repeat(${totalWeeks}, minmax(0, 1fr))` }}>
            {cells.map((d, idx) => {
              const place = { gridRow: Math.floor(idx / 7) + 1, gridColumn: (idx % 7) + 1 };
              if (d === null) {
                return <div key={`blank-${idx}`} className="box-inner calendar-cell is-blank" style={place} aria-hidden="true" />;
              }
              const key = toDateKey(year, month, d);
              const classes = ['box-inner', 'calendar-cell'];
              if (d === day) classes.push('selected');
              if (key === todayKey) classes.push('today');
              if (drag && drag.overKey === key && drag.schedule.date !== key) classes.push('drop-target');
              const allCount = (schedulesByDate.get(key) ?? EMPTY).length;
              const barLanes = layout.barLanesByDate.get(key) ?? 0;
              const singles = layout.singlesByDate.get(key) ?? EMPTY;
              const singleSlots = Math.max(0, MAX_ROWS - barLanes);
              const hidden = (layout.hiddenBarsByDate.get(key) ?? 0) + Math.max(0, singles.length - singleSlots);
              return (
                <button
                  type="button"
                  key={key}
                  data-date={key}
                  className={classes.join(' ')}
                  style={place}
                  onClick={() => selectDay(d)}
                  aria-pressed={d === day}
                  aria-label={`${month}월 ${d}일${allCount ? `, 일정 ${allCount}개` : ''}`}
                >
                  <span className="cell-date">{d}</span>
                  {barLanes > 0 && <span className="bar-spacer" style={{ '--lanes': barLanes }} aria-hidden="true" />}
                  {singles.slice(0, singleSlots).map((s) => {
                    const canDrag = permsOf(s).canDrag;
                    return (
                      <span
                        key={s.id}
                        className={`cell-chip ${canDrag ? 'is-draggable' : ''} ${draggingId === s.id ? 'is-drag-source' : ''} ${s.status === 'PENDING' ? 'is-pending' : ''}`}
                        title={`${formatRange(s)} ${s.title}`}
                        onPointerDown={canDrag ? (e) => startDrag(e, s) : undefined}
                      >
                        {s.title}
                      </span>
                    );
                  })}
                  {hidden > 0 && <span className="cell-more">+{hidden}</span>}
                </button>
              );
            })}

            {layout.bars.map((seg) => {
              const coversSelected = scheduleDayKeys(seg.s).includes(selectedKey);
              const s = seg.s;
              const canDrag = permsOf(s).canDrag;
              const classes = ['span-bar'];
              if (seg.isStart) classes.push('is-start');
              if (seg.isEnd) classes.push('is-end');
              if (canDrag) classes.push('is-draggable');
              if (draggingId === s.id) classes.push('is-drag-source');
              if (s.status === 'PENDING') classes.push('is-pending');
              if (coversSelected) classes.push('is-selected');
              const firstDay = cells[seg.row * 7 + seg.colStart];
              return (
                <div
                  key={`${s.id}-${seg.row}`}
                  className={classes.join(' ')}
                  style={{
                    gridRow: seg.row + 1,
                    gridColumn: `${seg.colStart + 1} / ${seg.colEnd + 2}`,
                    '--lane': seg.lane,
                  }}
                  title={`${formatRange(s)} ${s.title}`}
                  onClick={() => selectDay(firstDay)}
                  onPointerDown={canDrag ? (e) => startDrag(e, s) : undefined}
                >
                  {s.title}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="box-border schedule-bottom-box">
        <div className="schedule-bottom-content">
          <div className="section-label">
            {month}/{day} 일정
          </div>
          <div className="divider" />
          {daySchedules.length > 0 ? (
            <ul className="schedule-list">
              {daySchedules.map((s) => (
                <ScheduleItem
                  key={s.id}
                  schedule={s}
                  currentUserId={currentUserId}
                  perms={permsOf(s)}
                  isDragging={draggingId === s.id}
                  onDragStart={startDrag}
                  onEdit={() => onEditSchedule?.(s, { year, month, day })}
                  onDelete={() => onDeleteSchedule?.(s)}
                />
              ))}
            </ul>
          ) : (
            <p className="empty-text">등록된 일정이 없습니다.</p>
          )}
        </div>
        {(!isFriendView || extraActions) && (
          <div className="actions">
            {extraActions}
            {!isFriendView && (
              <button type="button" className="cyber-button" onClick={() => onOpenAddSchedule?.({ year, month, day })}>
                일정 추가
              </button>
            )}
          </div>
        )}
      </section>

      {drag && (
        <div
          ref={ghostRef}
          className="drag-ghost"
          style={{ transform: `translate(${ghostPos.x}px, ${ghostPos.y}px)` }}
          aria-hidden="true"
        >
          {drag.schedule.title}
        </div>
      )}
    </>
  );
}
