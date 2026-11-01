import { useCallback, useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5;

const findDateKey = (x, y) => document.elementFromPoint(x, y)?.closest('[data-date]')?.dataset.date ?? null;

export default function useScheduleDrag(onDrop) {
  const [drag, setDrag] = useState(null);
  const ghostRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const cleanupRef = useRef(null);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => () => cleanupRef.current?.(), []);

  const startDrag = useCallback((e, schedule) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let active = false;
    let overKey;

    const moveGhost = (x, y) => {
      posRef.current = { x, y };
      if (ghostRef.current) ghostRef.current.style.transform = `translate(${x}px, ${y}px)`;
    };

    const onMove = (ev) => {
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return;
        active = true;
        document.body.classList.add('is-dragging');
      }
      ev.preventDefault();
      moveGhost(ev.clientX, ev.clientY);
      const key = findDateKey(ev.clientX, ev.clientY);
      if (key !== overKey) {
        overKey = key;
        setDrag({ schedule, overKey: key });
      }
    };

    const finish = (shouldDrop) => {
      cleanup();
      if (!active) return;

      const swallowClick = (ce) => {
        ce.stopPropagation();
        ce.preventDefault();
      };
      window.addEventListener('click', swallowClick, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallowClick, true), 0);

      setDrag(null);
      if (shouldDrop && overKey != null && overKey !== schedule.date) {
        onDropRef.current(schedule, overKey);
      }
    };

    const onUp = () => finish(true);
    const onCancel = () => finish(false);
    const onKeyDown = (ev) => {
      if (ev.key !== 'Escape' || !active) return;
      ev.stopPropagation();
      finish(false);
    };

    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('keydown', onKeyDown, true);
      document.body.classList.remove('is-dragging');
      cleanupRef.current = null;
    }

    cleanupRef.current = cleanup;
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('keydown', onKeyDown, true);
  }, []);

  return { drag, ghostRef, ghostPos: posRef.current, startDrag };
}
