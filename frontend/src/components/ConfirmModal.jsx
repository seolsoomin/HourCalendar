import React from 'react';
import ModalShell from './ModalShell';

export default function ConfirmModal({ title, message, confirmLabel = '확인', danger = false, onConfirm, onClose }) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="confirm-text">{message}</p>
      <div className="actions actions--top">
        <button type="button" className="cyber-button" onClick={onClose} autoFocus>
          취소
        </button>
        <button type="button" className={`cyber-button ${danger ? 'btn-danger' : ''}`} onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
