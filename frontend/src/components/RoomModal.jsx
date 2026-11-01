import React, { useState } from 'react';
import ModalShell from './ModalShell';

export default function RoomModal({ onClose, onCreate, onJoin, onOpenRoom }) {
  const [tab, setTab] = useState('create');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const switchTab = (next) => {
    setTab(next);
    setError('');
  };

  const run = (task) => async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = run(async () => {
    setCreated(await onCreate(title.trim()));
  });

  const handleJoin = run(async () => {
    const room = await onJoin(code.trim());
    onOpenRoom(room);
    onClose();
  });

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(created.roomCode);
      setCopied(true);
    } catch {
    }
  };

  if (created) {
    return (
      <ModalShell title="방 만들기 완료" onClose={onClose}>
        <p className="confirm-text">
          [{created.title}] 방이 만들어졌습니다. 아래 방 코드를 함께할 사람들에게 공유하세요.
        </p>
        <div className="room-code-box">
          <span className="room-code">{created.roomCode}</span>
          <button type="button" className="cyber-button btn-sm" onClick={copyCode}>
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
        <div className="actions actions--top">
          <button type="button" className="cyber-button" onClick={onClose}>닫기</button>
          <button
            type="button"
            className="cyber-button"
            onClick={() => {
              onOpenRoom(created);
              onClose();
            }}
            autoFocus
          >
            방으로 이동
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="방" onClose={busy ? undefined : onClose}>
      <div className="tab-row" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'create'}
          className={`tab-button ${tab === 'create' ? 'active' : ''}`} onClick={() => switchTab('create')}>
          만들기
        </button>
        <button type="button" role="tab" aria-selected={tab === 'join'}
          className={`tab-button ${tab === 'join' ? 'active' : ''}`} onClick={() => switchTab('join')}>
          입장하기
        </button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={handleCreate}>
          <label htmlFor="room-title">방 이름</label>
          <input id="room-title" className="cyber-input" placeholder="예: 고등학교 친구들" maxLength={100}
            value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="actions actions--top">
            <button type="submit" className="cyber-button" disabled={busy}>{busy ? '만드는 중...' : '만들기'}</button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleJoin}>
          <label htmlFor="room-code">공유받은 방 코드</label>
          <input id="room-code" className="cyber-input room-code-input" placeholder="예: K7P2QX9M" maxLength={20}
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required autoFocus />
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="actions actions--top">
            <button type="submit" className="cyber-button" disabled={busy}>{busy ? '입장 중...' : '입장하기'}</button>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
