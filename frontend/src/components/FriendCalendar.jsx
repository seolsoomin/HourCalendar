import React, { useCallback, useEffect, useState } from 'react';
import CalendarMain from './CalendarMain';
import { friendApi } from '../api/client';

export default function FriendCalendar({ friend, onToggleSidebar, onDeleteFriend, onError }) {
  const [schedules, setSchedules] = useState([]);
  const [viewMonth, setViewMonth] = useState(null);

  const handleMonthChange = useCallback((year, month) => {
    setViewMonth((prev) => (prev?.year === year && prev?.month === month ? prev : { year, month }));
  }, []);

  useEffect(() => {
    if (!viewMonth) return;
    let ignore = false;
    friendApi
      .schedules(friend.userId, viewMonth.year, viewMonth.month)
      .then((list) => {
        if (!ignore) setSchedules(list);
      })
      .catch((err) => {
        if (!ignore) onError(err);
      });
    return () => {
      ignore = true;
    };
  }, [friend.userId, viewMonth, onError]);

  return (
    <CalendarMain
      ownerName={friend.nickname}
      isFriendView
      schedules={schedules}
      onMonthChange={handleMonthChange}
      onToggleSidebar={onToggleSidebar}
      extraActions={
        <button type="button" className="cyber-button btn-danger" onClick={() => onDeleteFriend(friend)}>
          친구 삭제
        </button>
      }
    />
  );
}
