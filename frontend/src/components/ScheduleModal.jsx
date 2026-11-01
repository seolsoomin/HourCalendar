import React, { useState } from 'react';
import ModalShell from './ModalShell';
import { toDateKey } from '../utils/date';
import { endDateOf } from '../utils/dateRange';
import { OVERLAP_CODE } from '../api/client';

export default function ScheduleModal({ date, schedule, onClose, onSave }) {
  const isEdit = Boolean(schedule);

  const [form, setForm] = useState(() => {
    if (isEdit) {
      return {
        title: schedule.title,
        date: schedule.date,
        endDate: endDateOf(schedule),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        memo: schedule.memo ?? '',
        isSecret: Boolean(schedule.isSecret),
        showInCompare: schedule.showInCompare !== false,
      };
    }
    const day = toDateKey(date.year, date.month, date.day);
    return {
      title: '',
      date: day,
      endDate: day,
      startTime: date.startTime ?? '',
      endTime: date.endTime ?? '',
      memo: '',
      isSecret: false,
      showInCompare: true,
    };
  });
  const [error, setError] = useState('');
  const [overlapWarning, setOverlapWarning] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'date' && next.endDate < value) next.endDate = value;
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
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, title: form.title.trim(), id: schedule?.id, allowOverlap });
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
    <ModalShell
      title={`${date.month}/${date.day} 일정 ${isEdit ? '수정' : '추가'}하기`}
      onClose={saving ? undefined : onClose}
    >
      <form onSubmit={handleSubmit}>
        <label htmlFor="sch-title">일정 이름 *</label>
        <input id="sch-title" name="title" className="cyber-input" maxLength={100}
          value={form.title} onChange={handleChange} required autoFocus />

        <div className="field-row">
          <div>
            <label htmlFor="sch-start-date">시작 날짜 *</label>
            <input id="sch-start-date" name="date" type="date" className="cyber-input"
              value={form.date} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="sch-start">시작 시간 *</label>
            <input id="sch-start" name="startTime" type="time" className="cyber-input"
              value={form.startTime} onChange={handleChange} required />
          </div>
        </div>

        <div className="field-row">
          <div>
            <label htmlFor="sch-end-date">종료 날짜 *</label>
            <input id="sch-end-date" name="endDate" type="date" className="cyber-input" min={form.date}
              value={form.endDate} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="sch-end">종료 시간 *</label>
            <input id="sch-end" name="endTime" type="time" className="cyber-input"
              value={form.endTime} onChange={handleChange} required />
          </div>
        </div>

        <label htmlFor="sch-memo">메모</label>
        <textarea id="sch-memo" name="memo" className="cyber-input textarea" maxLength={1000}
          value={form.memo} onChange={handleChange} />

        <label className="checkbox-row">
          <input type="checkbox" name="isSecret" checked={form.isSecret} onChange={handleChange} />
          비공개 일정 (친구에게는 시간만 보이고 제목·메모는 숨김)
        </label>

        {form.endDate > form.date && (
          <label className="checkbox-row">
            <input type="checkbox" name="showInCompare" checked={form.showInCompare} onChange={handleChange} />
            일정 비교 탭에도 표시 (끄면 함께 비는 시간 계산에서도 빠짐)
          </label>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}

        {overlapWarning && (
          <div className="form-warning" role="alert">
            <p className="form-warning-text">{overlapWarning}</p>
            <p className="form-warning-text">겹치는 것을 확인했다면 그대로 등록할 수 있습니다.</p>
            <div className="form-warning-actions">
              <button type="button" className="cyber-button btn-sm" onClick={() => save(true)} disabled={saving}>
                확인했습니다
              </button>
            </div>
          </div>
        )}

        <div className="actions actions--top">
          <button type="button" className="cyber-button" onClick={onClose} disabled={saving}>닫기</button>
          <button type="submit" className="cyber-button" disabled={saving}>
            {saving ? '저장 중...' : '완료하기'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
