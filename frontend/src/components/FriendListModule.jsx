import React from 'react';

export default function FriendListModule() {
  const cards = Array.from({ length: 6 }, (_, i) => i + 1);

  return (
    <div className="box-border" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '16px', borderBottom: '1px solid #00ffff', paddingBottom: '8px' }}>List</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, overflowY: 'auto' }}>
        {cards.map((c) => (
          <div key={c} className="box-border" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="box-inner profile-img-box" style={{ width: '70px', height: '90px' }}>
              <div className="profile-img-icon"></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
              <div>[ NICKNAME ]</div>
              <div>[ ID ]</div>
              <div>[ AGE ]</div>
              <div>[ BIRTH ]</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}