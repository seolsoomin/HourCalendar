import React, { useState } from 'react';

export default function ScheduleModal({ onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, startTime, endTime, memo });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="box-border modal-box">
        <h3>MM/DD 일정 추가하기</h3>
        <form onSubmit={handleSubmit}>
          <label>일정 이름 *</label>
          <input type="text" className="cyber-input" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <label>시작 *</label>
          <input type="text" placeholder="YY/MM/DD hh:mm" className="cyber-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />

          <label>종료 *</label>
          <input type="text" placeholder="YY/MM/DD hh:mm" className="cyber-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />

          <label>메모 *</label>
          <textarea className="cyber-input" style={{ height: '60px' }} value={memo} onChange={(e) => setMemo(e.target.value)} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="cyber-button" onClick={onClose}>닫기</button>
            <button type="submit" className="cyber-button">완료하기 &gt;</button>
          </div>
        </form>
      </div>
    </div>
  );
}