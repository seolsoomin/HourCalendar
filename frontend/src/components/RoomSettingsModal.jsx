import React, { useState } from 'react';
import ModalShell from './ModalShell';

export default function RoomSettingsModal({ room, isHost, onClose, onDelete, onLeave }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <ModalShell title="방 설정" onClose={onClose}>
      <p className="confirm-text room-settings-title">{room.title}</p>

      <div className="section-label">방 코드</div>
      <p className="hint-text">이 코드를 공유하면 다른 사람이 방에 들어올 수 있어요.</p>
      <div className="room-code-box">
        <span className="room-code">{room.roomCode}</span>
        <button type="button" className="cyber-button btn-sm" onClick={copyCode}>
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      <div className="actions actions--top">
        <button type="button" className="cyber-button" onClick={onClose} autoFocus>
          닫기
        </button>
        {isHost ? (
          <button type="button" className="cyber-button btn-danger" onClick={() => onDelete(room)}>
            방 삭제
          </button>
        ) : (
          <button type="button" className="cyber-button btn-danger" onClick={() => onLeave(room)}>
            방 나가기
          </button>
        )}
      </div>
    </ModalShell>
  );
}
