import React from 'react';

export default function MobileTopBar({ onToggleSidebar }) {
  return (
    <div className="mobile-top-bar">
      <button type="button" className="hamburger-btn" onClick={onToggleSidebar} aria-label="메뉴 열기">
        <span className="icon-bar" aria-hidden="true" />
      </button>
    </div>
  );
}
