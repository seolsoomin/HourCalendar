import React, { useState } from 'react';

export default function AuthModal({ onLoginSuccess }) {
  const [step, setStep] = useState('loading');

  return (
    <div className="modal-overlay">

      {step === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', width: '560px', alignItems: 'center' }}>
          <div style={{ marginBottom: '8px', fontSize: '14px', textAlign: 'center' }}>[ Loading... ]</div>
          <div className="box-border modal-box" style={{ width: '100%' }}>
            <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '24px' }}>
              <strong>일정 관리 및 조율이 편해지는 서비스, HOUR를 불러오는 중입니다.</strong><br/><br/>
              ⊙ 사람들마다 다른 일정 관리 시스템, 간편한 일정 조율 서비스의 부재.<br/>
              &nbsp;&nbsp;&nbsp;일정을 재조율하는 것에 지치지 않으셨나요?<br/><br/>
              그런 당신을 위한 서비스, HOUR입니다.<br/><br/>
              <strong>한 가지 서비스로 편하게 좋아하는 사람을 만나러 가세요.</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="cyber-button" onClick={() => setStep('login')}>로그인 &gt;</button>
              <button className="cyber-button" onClick={() => setStep('signup1')}>회원가입 &gt;</button>
            </div>
          </div>
        </div>
      )}

      {step === 'login' && (
        <div className="box-border modal-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>로그인</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setStep('loading')}>✕</span>
          </div>
          <label>ID*</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <label>PassWord*</label>
          <input type="password" className="cyber-input" defaultValue="TEXT HERE..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="cyber-button" onClick={onLoginSuccess}>로그인 &gt;</button>
          </div>
        </div>
      )}

      {step === 'signup1' && (
        <div className="box-border modal-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>회원가입</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setStep('loading')}>✕</span>
          </div>
          <label>Email*</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <label>ID*</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <div style={{ fontSize: '10px', color: '#88ffff', marginBottom: '8px' }}>사용 가능한 ID입니다.</div>
          <label>PassWord*</label>
          <input type="password" className="cyber-input" defaultValue="TEXT HERE..." />
          <label>NickName*</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="cyber-button" onClick={() => setStep('signup2')}>다음으로 &gt;</button>
          </div>
        </div>
      )}

      {step === 'signup2' && (
        <div className="box-border modal-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span>회원가입</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setStep('loading')}>✕</span>
          </div>
          <label>Profile Image</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <label>BackGround Image</label>
          <input type="text" className="cyber-input" defaultValue="TEXT HERE..." />
          <div style={{ fontSize: '10px', color: '#88ffff', marginBottom: '8px' }}>공란 시 Background Color만 나옵니다.</div>
          <label>BackGround Color</label>
          <input type="text" className="cyber-input" defaultValue="#111111" />
          <label>Point Color</label>
          <input type="text" className="cyber-input" defaultValue="#66FFFF" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="cyber-button" onClick={() => setStep('loading')}>완료하기 &gt;</button>
          </div>
        </div>
      )}
    </div>
  );
}