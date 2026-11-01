import React from 'react';
import useEscape from '../hooks/useEscape';

export function ModalHeader({ title, onClose }) {
  return (
    <div className="modal-header">
      <h3 className="modal-title">{title}</h3>
      {onClose && (
        <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  );
}

export default function ModalShell({ title, onClose, children, className = '' }) {
  useEscape(onClose, Boolean(onClose));

  const handleOverlayMouseDown = (e) => {
    if (onClose && e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className={`box-border modal-box ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        {title && <ModalHeader title={title} onClose={onClose} />}
        {children}
      </div>
    </div>
  );
}
