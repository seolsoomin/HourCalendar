import React, { useState } from 'react';
import ModalShell from './ModalShell';

export default function AddFriendModal({ onClose, onSubmit }) {
  const [loginId, setLoginId] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError('');
    try {
      await onSubmit(loginId.trim());
      setDone(`${loginId.trim()} 님에게 친구 요청을 보냈습니다.`);
      setLoginId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalShell title="친구 추가" onClose={sending ? undefined : onClose}>
      <form onSubmit={handleSubmit}>
        <label htmlFor="friend-id">친구의 아이디</label>
        <input
          id="friend-id"
          className="cyber-input"
          placeholder="친구의 아이디를 입력해 주세요"
          value={loginId}
          onChange={(e) => {
            setLoginId(e.target.value);
            setError('');
            setDone('');
          }}
          required
          autoFocus
        />
        {error && <div className="form-error" role="alert">{error}</div>}
        {done && <div className="form-success" role="status">{done}</div>}
        <div className="actions actions--top">
          <button type="button" className="cyber-button" onClick={onClose} disabled={sending}>닫기</button>
          <button type="submit" className="cyber-button" disabled={sending}>
            {sending ? '보내는 중...' : '친구 요청'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
