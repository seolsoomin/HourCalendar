import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import CalendarMain from './components/CalendarMain';
import CompareRoom from './components/CompareRoom';
import ScheduleModal from './components/ScheduleModal';
import AuthModal from './components/AuthModal';
import FriendListModule from './components/FriendListModule';
import './App.css';

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [currentView, setCurrentView] = useState('main');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const handleMenuClick = (menuKey) => {
    if (menuKey === 'friends') {
      setCurrentView('friendsMain');
    } else {
      setCurrentView(menuKey);
    }
  };

  if (!isAuth) {
    return <AuthModal onLoginSuccess={() => setIsAuth(true)} />;
  }

  return (
    <div className="app-container">
      <Sidebar onMenuClick={handleMenuClick} />

      <div className="content-area">
        {currentView === 'main' && (
          <CalendarMain title="YEAR / MONTH" onOpenAddSchedule={() => setIsScheduleModalOpen(true)} />
        )}
        {currentView === 'friendsMain' && (
          <CalendarMain title="[Friends Nickname] 's YEAR / MONTH" isFriendView={true} />
        )}
        {currentView === 'requests' && (
          <div className="box-border" style={{ padding: '16px', flex: 1 }}>
            <h3>Requests</h3>
            <div style={{ borderBottom: '1px solid #00ffff', margin: '8px 0' }}></div>
            <div>친구 요청 목록이 표시됩니다.</div>
          </div>
        )}
        {currentView === 'friendList' && (
          <FriendListModule />
        )}
        {(currentView === 'compareRoom1' || currentView === 'compareRoom2') && (
          <CompareRoom roomName={currentView === 'compareRoom1' ? 'HighSchool Friends' : 'Game Friends'} />
        )}
      </div>

      {isScheduleModalOpen && (
        <ScheduleModal 
          onClose={() => setIsScheduleModalOpen(false)} 
          onSave={(newSchedule) => {
            console.log('일정 저장:', newSchedule);
            alert('일정이 추가되었습니다.');
          }} 
        />
      )}
    </div>
  );
}