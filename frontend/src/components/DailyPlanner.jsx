import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MobileTopBar from './MobileTopBar';
import { scheduleApi, todoApi } from '../api/client';
import { addDays, endDateOf, formatRange, scheduleDayKeys, segmentOnDay } from '../utils/dateRange';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const SLOTS = [0, 10, 20, 30, 40, 50];
const MIN_ROW_H = 16;

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hm) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
const toHM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

function todayKey() {
  const t = new Date();
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return { year: y, month: m, day: d, weekday: new Date(y, m - 1, d).getDay() };
}

function assignLanes(items) {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed = [];
  let cluster = [];
  let clusterEnd = -1;

  const flush = () => {
    const laneEnds = [];
    cluster.forEach((it) => {
      let lane = laneEnds.findIndex((end) => end <= it.start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(it.end);
      } else {
        laneEnds[lane] = it.end;
      }
      it.lane = lane;
    });
    cluster.forEach((it) => placed.push({ ...it, lanes: laneEnds.length }));
    cluster = [];
    clusterEnd = -1;
  };

  sorted.forEach((it) => {
    if (cluster.length && it.start >= clusterEnd) flush();
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.end);
  });
  if (cluster.length) flush();
  return placed;
}

export default function DailyPlanner({ currentUserId, version, onAddSchedule, onEditSchedule, onToggleSidebar, onError }) {
  const [dayKey, setDayKey] = useState(todayKey);
  const [schedules, setSchedules] = useState([]);
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState('');
  const [rowH, setRowH] = useState(28);
  const tableRef = useRef(null);
  const isToday = dayKey === todayKey();
  const info = parseKey(dayKey);
  const date = { year: info.year, month: info.month, day: info.day };

  useEffect(() => {
    let ignore = false;
    scheduleApi
      .month(info.year, info.month)
      .then((list) => {
        if (!ignore) setSchedules(list.filter((s) => scheduleDayKeys(s).includes(dayKey)));
      })
      .catch((err) => {
        if (!ignore) onError?.(err);
      });
    return () => {
      ignore = true;
    };
  }, [dayKey, info.year, info.month, version, onError]);

  useEffect(() => {
    let ignore = false;
    todoApi
      .day(dayKey)
      .then((list) => {
        if (!ignore) setTodos(list);
      })
      .catch((err) => {
        if (!ignore) onError?.(err);
      });
    return () => {
      ignore = true;
    };
  }, [dayKey, onError]);

  const measure = useCallback(() => {
    const el = tableRef.current;
    if (!el) return;
    const head = el.querySelector('.planner-head')?.offsetHeight ?? 0;
    const fit = Math.floor(((el.clientHeight - head) / 24) * 100) / 100;
    setRowH((prev) => {
      const next = Math.max(MIN_ROW_H, fit);
      return Math.abs(prev - next) < 0.01 ? prev : next;
    });
  }, []);

  useLayoutEffect(() => {
    const el = tableRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      measure();
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const { singles, longs } = useMemo(() => {
    const s = [];
    const l = [];
    schedules.forEach((sch) => {
      const keys = scheduleDayKeys(sch);
      const seg = segmentOnDay(sch, dayKey);
      const item = { s: sch, start: toMinutes(seg.start), end: Math.max(toMinutes(seg.end), toMinutes(seg.start) + 10), seg };
      if (keys.length > 1) l.push(item);
      else s.push(item);
    });
    s.sort((a, b) => a.start - b.start);
    l.sort((a, b) => a.s.date.localeCompare(b.s.date));
    return { singles: s, longs: l };
  }, [schedules, dayKey]);

  const rows = useMemo(() => {
    const items = assignLanes(singles);
    return HOURS.map((h) => {
      const rowStart = h * 60;
      const rowEnd = rowStart + 60;
      const pieces = items
        .filter((it) => it.start < rowEnd && it.end > rowStart)
        .map((it) => ({
          ...it,
          from: Math.max(it.start, rowStart) - rowStart,
          to: Math.min(it.end, rowEnd) - rowStart,
          isFirst: it.start >= rowStart,
          isLast: it.end <= rowEnd,
        }));
      return { h, pieces };
    });
  }, [singles]);

  const canEdit = (s) => s.roomId == null && (currentUserId == null || s.ownerId == null || s.ownerId === currentUserId);

  const addTodo = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft('');
    try {
      const saved = await todoApi.create(dayKey, content);
      setTodos((prev) => [...prev, saved]);
    } catch (err) {
      setDraft(content);
      onError?.(err);
    }
  };

  const toggleTodo = async (todo) => {
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
    try {
      await todoApi.update(todo.id, { done: !todo.done });
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? todo : t)));
      onError?.(err);
    }
  };

  const removeTodo = async (todo) => {
    setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    try {
      await todoApi.remove(todo.id);
    } catch (err) {
      setTodos((prev) => [...prev, todo]);
      onError?.(err);
    }
  };

  const doneCount = todos.filter((t) => t.done).length;
  const busyMinutes = useMemo(() => {
    const marks = new Array(24 * 6).fill(false);
    singles.forEach(({ start, end }) => {
      for (let m = Math.floor(start / 10); m < Math.ceil(end / 10) && m < marks.length; m++) marks[m] = true;
    });
    return marks.filter(Boolean).length * 10;
  }, [singles]);

  return (
    <>
      <MobileTopBar onToggleSidebar={onToggleSidebar} />

      <section className="box-border calendar-main planner-main">
        <div className="calendar-header">
          <button type="button" className="cyber-button btn-sm" onClick={() => setDayKey((k) => addDays(k, -1))} aria-label="이전 날">
            &lt;
          </button>
          <div className="compare-title">
            <span className="calendar-title">
              {info.month}월 {info.day}일 ({DAY_NAMES[info.weekday]})
            </span>
            <span className="compare-range">
              {info.year}년
              {!isToday && (
                <button type="button" className="text-button" onClick={() => setDayKey(todayKey())}>
                  오늘
                </button>
              )}
            </span>
          </div>
          <button type="button" className="cyber-button btn-sm" onClick={() => setDayKey((k) => addDays(k, 1))} aria-label="다음 날">
            &gt;
          </button>
        </div>

        <div className="planner-body">
          <aside className="planner-side">
            <div className="planner-block">
              <div className="planner-label">
                오늘의 일정
                <span className="planner-count">총 {Math.floor(busyMinutes / 60)}시간 {busyMinutes % 60}분</span>
              </div>
              {longs.length === 0 && singles.length === 0 && <p className="empty-text">등록된 일정이 없습니다.</p>}
              <ul className="planner-list">
                {longs.map(({ s }) => (
                  <li key={`l-${s.id}`} className="planner-item is-long" title={`${formatRange(s)} ${s.title}`}>
                    <span className="planner-item-time">
                      ~{Number(endDateOf(s).slice(5, 7))}/{Number(endDateOf(s).slice(8))}
                    </span>
                    <span className="planner-item-title">{s.title}</span>
                  </li>
                ))}
                {singles.map(({ s, seg }) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="planner-item"
                      onClick={() => canEdit(s) && onEditSchedule?.(s, date)}
                      disabled={!canEdit(s)}
                    >
                      <span className="planner-item-time">{seg.start}</span>
                      <span className="planner-item-title">{s.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="planner-block planner-todos">
              <div className="planner-label">
                할 일
                {todos.length > 0 && (
                  <span className="planner-count">
                    {doneCount}/{todos.length}
                  </span>
                )}
              </div>
              <ul className="todo-list">
                {todos.map((t) => (
                  <li key={t.id} className={`todo-item ${t.done ? 'is-done' : ''}`}>
                    <label className="todo-check">
                      <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t)} />
                      <span className="todo-text">{t.content}</span>
                    </label>
                    <button type="button" className="text-button text-button--danger todo-remove" onClick={() => removeTodo(t)} aria-label={`${t.content} 삭제`}>
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <form className="todo-form" onSubmit={addTodo}>
                <input
                  className="cyber-input todo-input"
                  placeholder="할 일 추가 (Enter)"
                  maxLength={200}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </form>
            </div>
          </aside>

          <div className="planner-table" ref={tableRef} style={{ '--row-h': `${rowH}px` }}>
            <div className="planner-row planner-head" aria-hidden="true">
              <span className="planner-hour" />
              {SLOTS.map((m) => (
                <span key={m} className="planner-slot-head">
                  {m === 0 ? '' : m}
                </span>
              ))}
            </div>
            {rows.map(({ h, pieces }) => (
              <div key={h} className="planner-row">
                <span className="planner-hour">{pad(h)}</span>
                {SLOTS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    className="planner-slot"
                    onClick={() =>
                      onAddSchedule?.({
                        ...date,
                        startTime: toHM(h * 60 + m),
                        endTime: h * 60 + m + 60 >= 1440 ? '23:59' : toHM(h * 60 + m + 60),
                      })
                    }
                    aria-label={`${h}시 ${m}분에 일정 추가`}
                  />
                ))}
                <div className="planner-pieces">
                  {pieces.map(({ s, from, to, isFirst, isLast, lane, lanes, seg }) => {
                    const editable = canEdit(s);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        className={`planner-piece ${isFirst ? 'is-start' : ''} ${isLast ? 'is-end' : ''} ${s.status === 'PENDING' ? 'is-pending' : ''} ${editable ? '' : 'is-readonly'}`}
                        style={{
                          left: `${(from / 60) * 100}%`,
                          width: `${((to - from) / 60) * 100}%`,
                          top: `calc(${(lane / lanes) * 100}% + ${lanes > 1 ? 1 : 2}px)`,
                          height: `calc(${100 / lanes}% - ${lanes > 1 ? 1 : 4}px)`,
                        }}
                        title={`${seg.start}–${seg.end} ${s.title}`}
                        onClick={() => editable && onEditSchedule?.(s, date)}
                      >
                        {isFirst && <span className="planner-piece-title">{s.title}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
