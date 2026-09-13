import React, { useState } from 'react';

export default function CalendarMain({ onOpenAddSchedule }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(today.getDate());

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const blankDaysBefore = Array.from({ length: firstDayIndex }, () => null);
  const monthDays = Array.from({ length: totalDays }, (_, i) => i + 1);
  
  const totalCells = Math.ceil((blankDaysBefore.length + monthDays.length) / 7) * 7;
  const blankDaysAfterCount = totalCells - (blankDaysBefore.length + monthDays.length);
  const blankDaysAfter = Array.from({ length: blankDaysAfterCount }, () => null);

  const calendarCells = [...blankDaysBefore, ...monthDays, ...blankDaysAfter];
  const totalWeeks = calendarCells.length / 7; // 5주 또는 6주 계산

  return (
    <div className="content-area">
      <div className="box-border calendar-main">
        <div className="calendar-header">
          <span>{currentYear} / {currentMonth}</span>
          <div style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <span onClick={handlePrevMonth}>&lt;</span>
            <span onClick={handleNextMonth}>&gt;</span>
          </div>
        </div>

        <div className="calendar-table">
          <div className="weekday-row">
            {weekdays.map((w, idx) => (
              <div key={idx}>{w}</div>
            ))}
          </div>

          <div 
            className="calendar-grid" 
            style={{ gridTemplateRows: `repeat(${totalWeeks}, 1fr)` }}
          >
            {calendarCells.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="box-inner calendar-cell" style={{ cursor: 'default' }}></div>;
              }
              const isSelected = day === selectedDate;
              return (
                <div 
                  key={day} 
                  className={`box-inner calendar-cell ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="box-border schedule-bottom-box">
        <div>
          <div style={{ marginBottom: '8px' }}>{currentMonth}/{selectedDate} 's Schedule</div>
          <div style={{ borderBottom: '1px solid #00ffff', width: '100%' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="cyber-button" onClick={onOpenAddSchedule}>
            일정 추가 &gt;
          </button>
        </div>
      </div>
    </div>
  );
}