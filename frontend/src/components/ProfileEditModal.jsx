import React, { useState } from 'react';

export default function ProfileEditModal({ user, onClose, onSave }) {
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [age, setAge] = useState(user?.age || '');
  const [birth, setBirth] = useState(user?.birth || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ nickname, age, birth });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="box-border modal-box">
        <h3>ID CARD CONFIG</h3>
        <form onSubmit={handleSubmit}>
          <label>NICKNAME</label>
          <input type="text" className="cyber-input" value={nickname} onChange={(e) => setNickname(e.target.value)} required />

          <label>AGE</label>
          <input type="text" className="cyber-input" value={age} onChange={(e) => setAge(e.target.value)} required />

          <label>BIRTH</label>
          <input type="text" className="cyber-input" value={birth} onChange={(e) => setBirth(e.target.value)} required />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="cyber-button" onClick={onClose}>취소</button>
            <button type="submit" className="cyber-button">저장 &gt;</button>
          </div>
        </form>
      </div>
    </div>
  );
}