import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import MobileTopBar from './MobileTopBar';
import { scheduleApi } from '../api/client';
import { toDateKey } from '../utils/date';
import { addDays, endDateOf, formatRange, scheduleDayKeys, segmentOnDay } from '../utils/dateRange';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MIN_HOUR_H = 12;
const SNAP_MIN = 10;
const DRAG_THRESHOLD = 5;
const EDGE = 32;

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (hm) => {
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m;
};
const toHM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

function swallowNextClick() {
  const stop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, true), 0);
}

function getWeekDays(offset) {
  const t = new Date();
  const sunday = t.getDate() - t.getDay() + offset * 7;
  return DAY_NAMES.map((dayName, i) => {
    const d = new Date(t.getFullYear(), t.getMonth(), sunday + i);
    return {
      key: toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      dayName,
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  });
}

const todayKey = () => {
  const t = new Date();
  return toDateKey(t.getFullYear(), t.getMonth() + 1, t.getDate());
};

function layoutDay(items) {
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

export default function WeeklyCalendar({
  currentUserId,
  version,
  onAddSchedule,
  onEditSchedule,
  onReschedule,
  onMoveSchedule,
  onToggleSidebar,
  onError,
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const firstKey = days[0].key;
  const lastKey = days[6].key;
  const today = todayKey();
  const scrollRef = useRef(null);
  const ghostRef = useRef(null);
  const cleanupRef = useRef(null);
  const [drag, setDrag] = useState(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  useEffect(() => {
    const months = [...new Map(days.map((d) => [`${d.year}-${d.month}`, d])).values()];
    let ignore = false;
    Promise.all(months.map((d) => scheduleApi.month(d.year, d.month)))
      .then((lists) => {
        if (ignore) return;
        const byId = new Map();
        lists.flat().forEach((s) => byId.set(s.id, s));
        setSchedules([...byId.values()].filter((s) => s.date <= lastKey && endDateOf(s) >= firstKey));
      })
      .catch((err) => {
        if (!ignore) onError?.(err);
      });
    return () => {
      ignore = true;
    };
  }, [days, firstKey, lastKey, version, onError]);

  const [hourH, setHourH] = useState(28);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const head = el.querySelector('.week-head')?.offsetHeight ?? 0;
    const fit = Math.floor(((el.clientHeight - head) / 24) * 100) / 100;
    const next = Math.max(MIN_HOUR_H, fit);
    setHourH((prev) => (Math.abs(prev - next) < 0.01 ? prev : next));
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') {
      measure();
      return undefined;
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    const head = el.querySelector('.week-head');
    if (head) observer.observe(head);
    return () => observer.disconnect();
  }, [measure]);

  const byDay = useMemo(() => {
    const map = new Map(days.map((d) => [d.key, { longs: [], blocks: [] }]));
    schedules.forEach((s) => {
      const keys = scheduleDayKeys(s);
      if (keys.length > 1) {
        keys.forEach((k) => map.get(k)?.longs.push(s));
        return;
      }
      const entry = map.get(keys[0]);
      if (!entry) return;
      const seg = segmentOnDay(s, keys[0]);
      const start = toMinutes(seg.start);
      const realEnd = toMinutes(seg.end);
      const end = Math.max(realEnd, start + 15);
      entry.blocks.push({ s, start, end, duration: Math.max(realEnd - start, SNAP_MIN), startLabel: seg.start, endLabel: seg.end });
    });
    map.forEach((entry) => {
      entry.longs.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      entry.blocks = layoutDay(entry.blocks);
    });
    return map;
  }, [days, schedules]);

  useLayoutEffect(() => {
    measure();
  }, [byDay, measure]);

  const canEdit = (s) => s.roomId == null && (currentUserId == null || s.ownerId == null || s.ownerId === currentUserId);

  const beginDrag = (e, info) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const grabOffset = info.kind === 'block' ? e.clientY - e.currentTarget.getBoundingClientRect().top : 0;
    let active = false;
    let target = null;
    let lastSig = '';

    const findTarget = (x, y) => {
      const el = document.elementFromPoint(x, y)?.closest('[data-week-day]');
      if (!el) return null;
      const dayKey = el.dataset.weekDay;
      if (info.kind === 'long') return { dayKey };
      const col = scrollRef.current?.querySelector(`.week-col[data-week-day="${dayKey}"]`);
      if (!col) return null;
      const raw = ((y - col.getBoundingClientRect().top - grabOffset) / hourH) * 60;
      const snapped = Math.round(raw / SNAP_MIN) * SNAP_MIN;
      const start = Math.min(Math.max(snapped, 0), 1440 - info.duration);
      return { dayKey, start };
    };

    const autoScroll = (y) => {
      const box = scrollRef.current;
      if (!box) return;
      const r = box.getBoundingClientRect();
      if (y > r.bottom - EDGE) box.scrollTop += 12;
      else if (y < r.top + EDGE + 40) box.scrollTop -= 12;
    };

    const onMove = (ev) => {
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return;
        active = true;
        document.body.classList.add('is-dragging');
      }
      ev.preventDefault();
      if (info.kind === 'block') autoScroll(ev.clientY);
      if (ghostRef.current) ghostRef.current.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
      target = findTarget(ev.clientX, ev.clientY);
      const sig = target ? `${target.dayKey}|${target.start ?? ''}` : '';
      if (sig !== lastSig) {
        lastSig = sig;
        setDrag({ ...info, target, x: ev.clientX, y: ev.clientY });
      }
    };

    const finish = (drop) => {
      cleanup();
      if (!active) return;
      swallowNextClick();
      setDrag(null);
      if (drop && target) applyDrop(info, target);
    };
    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKey = (ev) => {
      if (ev.key !== 'Escape' || !active) return;
      ev.stopPropagation();
      finish(false);
    };

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKey, true);
      document.body.classList.remove('is-dragging');
      cleanupRef.current = null;
    }

    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKey, true);
  };

  const applyDrop = async (info, target) => {
    const { s } = info;
    if (info.kind === 'long') {
      if (target.dayKey !== s.date) onMoveSchedule?.(s.id, target.dayKey);
      return;
    }
    if (target.dayKey === info.dayKey && target.start === info.start) return;
    const end = target.start + info.duration;
    const next = {
      date: target.dayKey,
      endDate: end >= 1440 ? addDays(target.dayKey, 1) : target.dayKey,
      startTime: toHM(target.start),
      endTime: end >= 1440 ? '00:00' : toHM(end),
    };
    setSchedules((prev) => prev.map((x) => (x.id === s.id ? { ...x, ...next } : x)));
    const ok = await onReschedule?.(s, next);
    if (!ok) setSchedules((prev) => prev.map((x) => (x.id === s.id ? s : x)));
  };

  const blockDrag = drag?.kind === 'block' ? drag : null;
  const longDrag = drag?.kind === 'long' ? drag : null;

  const headerTitle = `${days[3].year}년 ${days[3].month}월`;
  const range = `${days[0].month}/${days[0].day} – ${days[6].month}/${days[6].day}`;

  return (
    <>
      <MobileTopBar onToggleSidebar={onToggleSidebar} />

      <section className="box-border calendar-main weekly-main">
        <div className="calendar-header">
          <button type="button" className="cyber-button btn-sm" onClick={() => setWeekOffset((w) => w - 1)} aria-label="이전 주">
            &lt;
          </button>
          <div className="compare-title">
            <span className="calendar-title">{headerTitle}</span>
            <span className="compare-range">
              {range}
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

        <div className="week-scroll" ref={scrollRef}>
          <div className="week-grid" style={{ '--hour-h': `${hourH}px` }}>
            {days.map((d) => {
              const entry = byDay.get(d.key);
              return (
                <div
                  key={`head-${d.key}`}
                  data-week-day={d.key}
                  className={`week-head ${d.key === today ? 'is-today' : ''} ${longDrag?.target?.dayKey === d.key ? 'is-drop-target' : ''}`}
                >
                  <div className="week-head-date">
                    <span className="week-head-name">{d.dayName}</span>
                    <span className="week-head-day">{d.day}</span>
                  </div>
                  {entry.longs.length > 0 && (
                    <div className="week-head-longs">
                      {entry.longs.map((s) => {
                        const draggable = canEdit(s) && Boolean(onMoveSchedule);
                        const classes = ['week-long'];
                        if (draggable) classes.push('is-draggable');
                        if (longDrag?.s.id === s.id) classes.push('is-drag-source');
                        return (
                          <span
                            key={s.id}
                            className={classes.join(' ')}
                            title={`${formatRange(s)} ${s.title}`}
                            onPointerDown={draggable ? (e) => beginDrag(e, { kind: 'long', s }) : undefined}
                          >
                            {s.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {days.map((d) => {
              const entry = byDay.get(d.key);
              const date = { year: d.year, month: d.month, day: d.day };
              return (
                <div
                  key={`col-${d.key}`}
                  data-week-day={d.key}
                  className={`week-col ${d.key === today ? 'is-today' : ''} ${longDrag?.target?.dayKey === d.key ? 'is-drop-target' : ''}`}
                >
                  {HOURS.map((h) => (
                    <button
                      type="button"
                      key={h}
                      className="week-hour"
                      onClick={() => onAddSchedule?.({ ...date, startTime: `${pad(h)}:00`, endTime: h === 23 ? '23:59' : `${pad(h + 1)}:00` })}
                      aria-label={`${d.month}월 ${d.day}일 ${h}시에 일정 추가`}
                    >
                      <span className="week-hour-label">{pad(h)}</span>
                    </button>
                  ))}

                  <div className="week-blocks">
                    {entry.blocks.map(({ s, start, end, duration, lane, lanes, startLabel, endLabel }) => {
                      const editable = canEdit(s);
                      const draggable = editable && Boolean(onReschedule);
                      const classes = ['week-block'];
                      if (s.status === 'PENDING') classes.push('is-pending');
                      if (!editable) classes.push('is-readonly');
                      if (draggable) classes.push('is-draggable');
                      if (blockDrag?.s.id === s.id) classes.push('is-drag-source');
                      const short = (end - start) / 60 * hourH < 30;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          className={classes.join(' ')}
                          style={{
                            top: (start / 60) * hourH,
                            height: Math.max(((end - start) / 60) * hourH - 2, 14),
                            left: `${(lane / lanes) * 100}%`,
                            width: `calc(${100 / lanes}% - 2px)`,
                          }}
                          title={`${startLabel}–${endLabel} ${s.title}`}
                          onClick={() => editable && onEditSchedule?.(s, date)}
                          onPointerDown={
                            draggable ? (e) => beginDrag(e, { kind: 'block', s, dayKey: d.key, start, duration }) : undefined
                          }
                        >
                          <span className="week-block-title">{s.title}</span>
                          {!short && <span className="week-block-time">{startLabel}–{endLabel}</span>}
                        </button>
                      );
                    })}

                    {blockDrag?.target?.dayKey === d.key && (
                      <div
                        className="week-block is-ghost"
                        style={{
                          top: (blockDrag.target.start / 60) * hourH,
                          height: Math.max((blockDrag.duration / 60) * hourH - 2, 14),
                          left: 0,
                          width: 'calc(100% - 2px)',
                        }}
                        aria-hidden="true"
                      >
                        <span className="week-block-title">{blockDrag.s.title}</span>
                        <span className="week-block-time">
                          {toHM(blockDrag.target.start)}–{toHM((blockDrag.target.start + blockDrag.duration) % 1440)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {longDrag && (
        <div
          ref={ghostRef}
          className="drag-ghost"
          style={{ transform: `translate(${longDrag.x}px, ${longDrag.y}px)` }}
          aria-hidden="true"
        >
          {longDrag.s.title}
        </div>
      )}
    </>
  );
}
