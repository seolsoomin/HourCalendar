import React from 'react';

export default function CompareRoom({ roomName }) {
  const getWeeklyDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const weekDays = [];
    const weekdaysName = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push({
        dateStr: `${d.getMonth() + 1}/${d.getDate()}`, 
        dayName: weekdaysName[i]
      });
    }
    return weekDays;
  };

  const days = getWeeklyDays();

  return (
    <div className="content-area">
      <div className="box-border compare-container">
        <div className="calendar-header">
          <span>[{roomName || 'Compare Room Name'}]</span>
          <div style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <span>&lt;</span>
            <span>&gt;</span>
          </div>
        </div>

        <div className="compare-calendar-box">
          {days.map((d, index) => (
            <div key={index} className="box-inner compare-day-cell">
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{d.dayName}</div>
              <div style={{ fontSize: '11px', color: '#88ffff' }}>{d.dateStr}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="box-border schedule-bottom-box">
        <div>
          <div style={{ marginBottom: '8px' }}>Free Time</div>
          <div style={{ borderBottom: '1px solid #00ffff', width: '100%' }}></div>
        </div>
        <div style={{ fontSize: '12px', color: '#88ffff', padding: '4px 0' }}>
          참여자들의 겹치지 않는 빈 시간대가 출력되는 공간입니다.
        </div>
      </div>
    </div>
  );
}