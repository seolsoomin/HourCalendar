import React from 'react';

export default function LoadingModal({ onConfirm }) {
  return (
    <div className="modal-overlay">
      <div className="box-border modal-box">
        <div style={{ fontSize: '15px', marginBottom: '12px' }}>Loading...</div>
        <div style={{ borderBottom: '1px solid #00ffff', marginBottom: '12px' }}></div>
        <div style={{ fontSize: '12px', lineHeight: '1.6', marginBottom: '20px' }}>
          [System Notice]<br/>
          1. 서비스 이용을 위한 데이터를 동기화 중입니다.<br/>
          2. 네트워크 환경에 따라 수 초가 소요될 수 있습니다.<br/>
          <br/>
          모든 데이터 로딩이 완료되면 시스템에 진입합니다.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="cyber-button" onClick={onConfirm}>확인 &gt;</button>
        </div>
      </div>
    </div>
  );
}