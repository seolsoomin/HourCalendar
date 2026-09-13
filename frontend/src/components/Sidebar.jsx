import React from 'react';

export default function Sidebar({ user, onMenuClick }) {
  return (
    <div className="sidebar">
      <div className="box-inner id-card">
        <div className="id-card-header">
          <span>ID CARD</span>
          <span className="cyber-icon icon-gear" style={{ cursor: 'pointer' }} onClick={() => onMenuClick('editProfile')}></span>
        </div>
        <div style={{ borderBottom: '1px solid #00ffff', marginBottom: '10px' }}></div>
        
        <div className="id-card-body">
          <div className="box-inner profile-img-box">
            <div className="profile-img-icon"></div>
          </div>
          
          <div className="id-card-info">
            <div>{user?.nickname || '[ NICKNAME ]'}</div>
            <div>{user?.id || '[ ID ]'}</div>
            <div>{user?.age || '[ AGE ]'}</div>
            <div>{user?.birth || '[ BIRTH ]'}</div>
          </div>
        </div>
      </div>

      <div className="box-inner folder-box">
        <div style={{ marginBottom: '8px' }}>Folder</div>
        
        <div className="menu-item" onClick={() => onMenuClick('main')}>
          <span className="cyber-icon icon-folder"></span> Main
        </div>
        
        <div className="menu-item" style={{ marginTop: '8px' }}>
          <span className="cyber-icon icon-folder"></span> Friends
        </div>
        <div className="menu-item menu-item-sub" onClick={() => onMenuClick('requests')}>
          <span className="cyber-icon icon-document"></span> Requests
        </div>
        <div className="menu-item menu-item-sub" onClick={() => onMenuClick('friendList')}>
          <span className="cyber-icon icon-document"></span> List
        </div>
        
        <div className="menu-item" style={{ marginTop: '8px' }}>
          <span className="cyber-icon icon-folder"></span> Comparing
        </div>
        <div className="menu-item menu-item-sub" onClick={() => onMenuClick('compareRoom1')}>
          <span className="cyber-icon icon-document"></span> HighSchool Friends
        </div>
        <div className="menu-item menu-item-sub" onClick={() => onMenuClick('compareRoom2')}>
          <span className="cyber-icon icon-document"></span> Game Friends
        </div>
      </div>
    </div>
  );
}