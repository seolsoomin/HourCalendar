import React, { useState } from 'react';
import ModalShell from './ModalShell';
import { OVERLAP_CODE } from '../api/client';

export default function GroupScheduleModal({ roomTitle, members, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    date: initial?.date ?? '',
    endDate: initial?.endDate ?? initial?.date ?? '',
    startTime: initial?.startTime ?? '',
    endTime: initial?.endTime ?? '',
    memo: '',
  });
  const [checked, setChecked] = useState(() => new Set());
  const [error, setError] = useState('');
  const [overlapWarning, setOverlapWarning] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'date' && (!next.endDate || next.endDate < value)) next.endDate = value;
      return next;
    });
    if (error) setError('');
    if (overlapWarning) setOverlapWarning('');
  };

  const toggleMember = (userId) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
    if (error) setError('');
    if (overlapWarning) setOverlapWarning('');
  };

  const save = async (allowOverlap) => {
    if (saving) return;
    if (`${form.endDate}T${form.endTime}` <= `${form.date}T${form.startTime}`) {
      setError('종료 일시는 시작 일시보다 늦어야 합니다.');
      return;
    }
    if (checked.size === 0) {
      setError('함께할 사람을 1명 이상 선택해 주세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({ ...form, title: form.title.trim(), memberIds: [...checked], allowOverlap });
      onClose();
    } catch (err) {
      if (err.code === OVERLAP_CODE) {
        setOverlapWarning(err.message);
      } else {
        setOverlapWarning('');
        setError(err.message);
      }
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    save(false);
  };

  return (
    <ModalShell title={`[${roomTitle}] 다인 일정 추가`} onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="grp-title">일정 이름 *</label>
        <input id="grp-title" name="title" className="cyber-input" maxLength={100}
          value={form.title} onChange={handleChange} required autoFocus />

        <div className="field-row">
          <div>
            <label htmlFor="grp-date">시작 날짜 *</label>
            <input id="grp-date" name="date" type="date" className="cyber-input"
              value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="grp-start">시작 시간 *</label>
            <input id="grp-start" name="startTime" type="time" className="cyber-input"
              value={form.startTime} onChange={handleChange} required />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="grp-end-date">종료 날짜 *</label>
            <input id="grp-end-date" name="endDate" type="date" className="cyber-input" min={form.date}
              value={form.endDate} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="grp-end">종료 시간 *</label>
            <input id="grp-end" name="endTime" type="time" className="cyber-input"
              value={form.endTime} onChange={handleChange} required />
          </div>
        </div>

        <label htmlFor="grp-memo">메모</label>
        <textarea id="grp-memo" name="memo" className="cyber-input textarea" maxLength={1000}
          value={form.memo} onChange={handleChange} />

        <div className="section-label">함께할 사람 *</div>
        {members.length === 0 ? (
          <p className="empty-text">아직 이 방에 다른 사람이 없습니다. 방 코드를 공유해 보세요.</p>
        ) : (
          <div className="member-check-list">
            {members.map((m) => (
              <label key={m.userId} className="checkbox-row">
                <input type="checkbox" checked={checked.has(m.userId)} onChange={() => toggleMember(m.userId)} />
                {m.nickname} <span className="request-sub">({m.loginId})</span>
              </label>
            ))}
          </div>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}

        {overlapWarning && (
          <div className="form-warning" role="alert">
            <p className="form-warning-text">{overlapWarning}</p>
            <p className="form-warning-text">겹치는 것을 확인했다면 그대로 초대를 보낼 수 있습니다.</p>
            <div className="form-warning-actions">
              <button type="button" className="cyber-button btn-sm" onClick={() => save(true)} disabled={saving}>
                확인했습니다
              </button>
            </div>
          </div>
        )}

        <div className="actions actions--top">
          <button type="button" className="cyber-button" onClick={onClose} disabled={saving}>닫기</button>
          <button type="submit" className="cyber-button" disabled={saving || members.length === 0}>
            {saving ? '보내는 중...' : '초대 보내기'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
