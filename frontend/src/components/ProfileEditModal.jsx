import React, { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import ImageCropper from './ImageCropper';
import { ACCENTS, findAccent } from '../utils/accent';
import { FONTS, fontValue, parseFont, weightName } from '../utils/fonts';

const today = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function WithdrawPanel({ onBack, onWithdraw }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onWithdraw(password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <ModalShell title="회원탈퇴" onClose={busy ? undefined : onBack}>
      <form onSubmit={handleSubmit}>
        <div className="withdraw-warning">
          탈퇴하면 아래 정보가 <strong>모두 삭제되고 되돌릴 수 없습니다.</strong>
          <ul>
            <li>내 정보와 프로필 사진</li>
            <li>내 일정, 다인 일정 참여 기록</li>
            <li>친구 목록과 친구 요청, 알림</li>
            <li>내가 만든 방 (다른 참여자에게서도 사라짐)</li>
          </ul>
        </div>

        <label htmlFor="wd-pw">비밀번호*</label>
        <input id="wd-pw" type="password" className="cyber-input" placeholder="비밀번호를 입력해 주세요"
          autoComplete="current-password" value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError('');
          }}
          required autoFocus />

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="actions actions--top">
          <button type="button" className="cyber-button" onClick={onBack} disabled={busy}>취소</button>
          <button type="submit" className="cyber-button btn-danger" disabled={busy || !password}>
            {busy ? '탈퇴 중...' : '탈퇴하기'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function ProfileEditModal({ user, onClose, onSave, onPreviewColor, onPreviewFont, onWithdraw }) {
  const [form, setForm] = useState(() => ({
    nickname: user?.nickname ?? '',
    birth: user?.birth ?? '',
    pointColor: findAccent(user?.pointColor).light,
    font: parseFont(user?.font).value,
  }));
  const [imageChange, setImageChange] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    const url = imageChange?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [imageChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const pickColor = (hex) => {
    setForm((prev) => ({ ...prev, pointColor: hex }));
    onPreviewColor?.(hex);
  };

  const pickFont = (value) => {
    setForm((prev) => ({ ...prev, font: value }));
    onPreviewFont?.(value);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('사진 파일만 고를 수 있습니다.');
      return;
    }
    setError('');
    setCropFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await onSave({
        nickname: form.nickname.trim(),
        birth: form.birth,
        pointColor: form.pointColor,
        font: form.font,
        imageBlob: imageChange && imageChange !== 'remove' ? imageChange.blob : null,
        removeImage: imageChange === 'remove',
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const shownImage =
    imageChange === 'remove' ? null : imageChange?.previewUrl ?? user?.profileImage ?? null;

  if (withdrawing) {
    return <WithdrawPanel onBack={() => setWithdrawing(false)} onWithdraw={onWithdraw} />;
  }

  if (cropFile) {
    return (
      <ModalShell title="사진 자르기 (3:4)" onClose={() => setCropFile(null)}>
        <ImageCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onDone={(blob, previewUrl) => {
            setImageChange({ blob, previewUrl });
            setCropFile(null);
          }}
        />
      </ModalShell>
    );
  }

  return (
    <ModalShell title="프로필 수정" onClose={saving ? undefined : onClose}>
      <form onSubmit={handleSubmit}>
        <div className="section-label">사진</div>
        <div className="photo-row">
          <div className="box-inner profile-img-box profile-img-box--edit">
            {shownImage ? <img className="profile-img" src={shownImage} alt="" /> : <div className="profile-img-icon" />}
          </div>
          <div className="photo-actions">
            <label className="cyber-button btn-sm file-button">
              사진 선택
              <input type="file" accept="image/*" onChange={handleFile} hidden />
            </label>
            {shownImage && (
              <button type="button" className="cyber-button btn-sm" onClick={() => setImageChange('remove')}>
                기본 아이콘으로
              </button>
            )}
            <span className="field-hint">고른 사진은 3:4 비율로 잘라서 올라갑니다.</span>
          </div>
        </div>

        <label htmlFor="pf-nickname">닉네임</label>
        <input id="pf-nickname" name="nickname" className="cyber-input" maxLength={50}
          value={form.nickname} onChange={handleChange} required />

        <label htmlFor="pf-birth">생일</label>
        <input id="pf-birth" name="birth" type="date" className="cyber-input" max={today()}
          value={form.birth} onChange={handleChange} />
        <div className="field-hint">나이는 생일로 자동 계산됩니다.</div>

        <div className="section-label">테마 색상</div>
        <div className="color-swatches" role="radiogroup" aria-label="테마 색상">
          {ACCENTS.map((a) => {
            const selected = form.pointColor.toUpperCase() === a.light.toUpperCase();
            return (
              <button
                type="button"
                key={a.key}
                role="radio"
                aria-checked={selected}
                aria-label={a.label}
                title={a.label}
                className={`color-swatch ${selected ? 'is-selected' : ''}`}
                style={{ '--swatch': a.light }}
                onClick={() => pickColor(a.light)}
              />
            );
          })}
        </div>

        <label htmlFor="pf-font">글꼴</label>
        <select id="pf-font" className="cyber-input" value={form.font}
          onChange={(e) => pickFont(e.target.value)}>
          {FONTS.map((f) => (
            <optgroup key={f.key} label={f.label}>
              {f.weights.map((w) => (
                <option key={w} value={fontValue(f, w)}>
                  {f.label} {weightName(w)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="actions actions--top actions--split">
          {onWithdraw && (
            <button type="button" className="text-button text-button--danger" onClick={() => setWithdrawing(true)}
              disabled={saving}>
              회원탈퇴
            </button>
          )}
          <div className="actions">
            <button type="button" className="cyber-button" onClick={onClose} disabled={saving}>취소</button>
            <button type="submit" className="cyber-button" disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}
