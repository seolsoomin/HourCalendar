import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import CalendarMain from './components/CalendarMain';
import WeeklyCalendar from './components/WeeklyCalendar';
import DailyPlanner from './components/DailyPlanner';
import CompareRoom from './components/CompareRoom';
import ScheduleModal from './components/ScheduleModal';
import ProfileEditModal from './components/ProfileEditModal';
import ConfirmModal from './components/ConfirmModal';
import ModalShell from './components/ModalShell';
import AuthModal from './components/AuthModal';
import FriendListModule from './components/FriendListModule';
import FriendRequests from './components/FriendRequests';
import FriendCalendar from './components/FriendCalendar';
import AddFriendModal from './components/AddFriendModal';
import RoomModal from './components/RoomModal';
import RoomSettingsModal from './components/RoomSettingsModal';
import NotificationPanel from './components/NotificationPanel';
import MobileTopBar from './components/MobileTopBar';
import useEscape from './hooks/useEscape';
import { applyAccent } from './utils/accent';
import { applyFont } from './utils/fonts';
import {
  authApi,
  friendApi,
  invitationApi,
  notificationApi,
  roomApi,
  scheduleApi,
  userApi,
  OVERLAP_CODE,
} from './api/client';
import './App.css';

const THEME_KEY = 'hour-theme';
const LOOK_KEY = 'hour-look';
const POLL_MS = 30000;

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedLook() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOOK_KEY) || '{}');
    return { pointColor: saved.pointColor ?? null, font: saved.font ?? null };
  } catch {
    return { pointColor: null, font: null };
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [currentView, setCurrentView] = useState('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [previewColor, setPreviewColor] = useState(null);
  const [previewFont, setPreviewFont] = useState(null);
  const [savedLook, setSavedLook] = useState(getSavedLook);
  const [modal, setModal] = useState(null);

  const [schedules, setSchedules] = useState([]);
  const [viewMonth, setViewMonth] = useState(null);
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const userId = user?.userId;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.setAttribute('content', theme === 'dark' ? '#121212' : '#FAFAFA'));
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
    }
  }, [theme]);

  useEffect(() => {
    if (!user) return;
    const look = { pointColor: user.pointColor ?? null, font: user.font ?? null };
    setSavedLook(look);
    try {
      localStorage.setItem(LOOK_KEY, JSON.stringify(look));
    } catch {
    }
  }, [user]);

  useEffect(() => {
    applyAccent(previewColor ?? user?.pointColor ?? savedLook.pointColor, theme);
  }, [previewColor, user?.pointColor, savedLook.pointColor, theme]);

  useEffect(() => {
    applyFont(previewFont ?? user?.font ?? savedLook.font);
  }, [previewFont, user?.font, savedLook.font]);

  useEffect(() => {
    userApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const resetAfterLogout = useCallback(() => {
    setUser(null);
    setSchedules([]);
    setViewMonth(null);
    setFriends([]);
    setSelectedFriend(null);
    setRequests([]);
    setRooms([]);
    setNotifications([]);
    setInvitations([]);
    setCurrentView('main');
    setModal(null);
    setPreviewColor(null);
    setPreviewFont(null);
    setIsSidebarOpen(false);
  }, []);

  const handleApiError = useCallback(
    (err) => {
      if (err.status === 401) {
        resetAfterLogout();
      } else {
        setModal({ type: 'message', message: err.message });
      }
    },
    [resetAfterLogout]
  );

  const loadRooms = useCallback(async () => {
    setRooms(await roomApi.list());
  }, []);

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      setFriends(await friendApi.list());
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      setRequests(await friendApi.received());
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  const loadInbox = useCallback(async () => {
    const [notis, invites] = await Promise.all([notificationApi.unread(), invitationApi.list()]);
    setNotifications(notis);
    setInvitations(invites);
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    const refresh = () => Promise.all([loadRooms(), loadRequests(), loadInbox()]).catch(handleApiError);
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [userId, loadRooms, loadRequests, loadInbox, handleApiError]);

  useEffect(() => {
    if (!userId) return;
    if (currentView === 'friendList') loadFriends().catch(handleApiError);
    if (currentView === 'requests') loadRequests().catch(handleApiError);
  }, [currentView, userId, loadFriends, loadRequests, handleApiError]);

  useEffect(() => {
    if (!userId || !viewMonth) return undefined;
    let ignore = false;
    scheduleApi
      .month(viewMonth.year, viewMonth.month)
      .then((list) => {
        if (!ignore) setSchedules(list);
      })
      .catch((err) => {
        if (!ignore) handleApiError(err);
      });
    return () => {
      ignore = true;
    };
  }, [userId, viewMonth, scheduleVersion, handleApiError]);

  const handleMonthChange = useCallback((year, month) => {
    setViewMonth((prev) => (prev?.year === year && prev?.month === month ? prev : { year, month }));
  }, []);

  const refreshSchedules = useCallback(() => setScheduleVersion((v) => v + 1), []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const closeModal = useCallback(() => setModal(null), []);

  useEscape(closeSidebar, isSidebarOpen && !modal);

  const handleMenuClick = useCallback((menuKey) => {
    if (menuKey === 'editProfile') {
      setModal({ type: 'profile' });
    } else if (menuKey === 'roomAdd') {
      setModal({ type: 'room' });
    } else {
      setCurrentView(menuKey);
    }
    setIsSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    }
    resetAfterLogout();
  }, [resetAfterLogout]);

  const openLogout = useCallback(() => setModal({ type: 'logout' }), []);
  const openAddSchedule = useCallback((date) => setModal({ type: 'schedule', date }), []);
  const openEditSchedule = useCallback((schedule, date) => setModal({ type: 'schedule', date, schedule }), []);
  const openDeleteSchedule = useCallback((schedule) => setModal({ type: 'deleteSchedule', schedule }), []);

  const handleSaveSchedule = useCallback(async (schedule) => {
    if (schedule.id) {
      const saved = await scheduleApi.update(schedule.id, schedule);
      setSchedules((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    } else {
      const saved = await scheduleApi.create(schedule);
      setSchedules((prev) => [...prev, saved]);
    }
    setScheduleVersion((v) => v + 1);
  }, []);

  const handleMoveSchedule = useCallback(
    async (id, date, allowOverlap = false) => {
      try {
        const saved = await scheduleApi.move(id, date, allowOverlap);
        setSchedules((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        setScheduleVersion((v) => v + 1);
      } catch (err) {
        if (err.code === OVERLAP_CODE && !allowOverlap) {
          setModal({ type: 'moveOverlap', id, date, message: err.message });
        } else {
          handleApiError(err);
        }
      }
    },
    [handleApiError]
  );

  const handleRescheduleSchedule = useCallback(
    async (schedule, next, allowOverlap = false) => {
      try {
        const saved = await scheduleApi.update(schedule.id, { ...schedule, ...next, allowOverlap });
        setSchedules((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        setScheduleVersion((v) => v + 1);
        return true;
      } catch (err) {
        if (err.code === OVERLAP_CODE && !allowOverlap) {
          setModal({ type: 'rescheduleOverlap', schedule, next, message: err.message });
        } else {
          handleApiError(err);
        }
        return false;
      }
    },
    [handleApiError]
  );

  const handleDeleteSchedule = useCallback(
    async (id) => {
      try {
        await scheduleApi.remove(id);
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        setScheduleVersion((v) => v + 1);
      } catch (err) {
        handleApiError(err);
      }
    },
    [handleApiError]
  );

  const handleSaveProfile = useCallback(async (data) => {
    let me = await userApi.updateProfile(data);
    setUser(me);
    setPreviewColor(null);
    setPreviewFont(null);
    try {
      if (data.imageBlob) me = await userApi.uploadProfileImage(data.imageBlob);
      else if (data.removeImage) me = await userApi.removeProfileImage();
    } catch (err) {
      throw new Error(`프로필 정보는 저장됐지만 사진은 저장하지 못했습니다: ${err.message}`);
    }
    setUser(me);
  }, []);

  const handleWithdraw = useCallback(
    async (password) => {
      await userApi.withdraw(password);
      resetAfterLogout();
    },
    [resetAfterLogout]
  );

  const closeProfile = useCallback(() => {
    setPreviewColor(null);
    setPreviewFont(null);
    setModal(null);
  }, []);

  const openFriendCalendar = useCallback((friend) => {
    setSelectedFriend(friend);
    setCurrentView('friendCalendar');
  }, []);

  const handleAcceptFriend = useCallback(
    async (friendshipId) => {
      try {
        await friendApi.accept(friendshipId);
        await Promise.all([loadRequests(), loadFriends()]);
      } catch (err) {
        handleApiError(err);
      }
    },
    [loadRequests, loadFriends, handleApiError]
  );

  const handleRejectFriend = useCallback(
    async (friendshipId) => {
      try {
        await friendApi.reject(friendshipId);
        await loadRequests();
      } catch (err) {
        handleApiError(err);
      }
    },
    [loadRequests, handleApiError]
  );

  const handleDeleteFriend = useCallback(
    async (friend) => {
      try {
        await friendApi.remove(friend.userId);
        setSelectedFriend(null);
        setCurrentView('friendList');
      } catch (err) {
        handleApiError(err);
      }
    },
    [handleApiError]
  );

  const openRoom = useCallback((room) => setCurrentView(`room-${room.roomId}`), []);

  const openRoomSettings = useCallback((room) => {
    setIsSidebarOpen(false);
    setModal({ type: 'roomSettings', room });
  }, []);

  const closeRoom = useCallback(
    async (room, action) => {
      try {
        await (action === 'delete' ? roomApi.remove(room.roomId) : roomApi.leave(room.roomId));
        setCurrentView((view) => (view === `room-${room.roomId}` ? 'main' : view));
        await loadRooms();
        refreshSchedules();
      } catch (err) {
        handleApiError(err);
      }
    },
    [loadRooms, refreshSchedules, handleApiError]
  );

  const handleCreateRoom = useCallback(
    async (title) => {
      const room = await roomApi.create(title);
      await loadRooms();
      return room;
    },
    [loadRooms]
  );

  const handleJoinRoom = useCallback(
    async (code) => {
      const room = await roomApi.join(code);
      await loadRooms();
      return room;
    },
    [loadRooms]
  );

  const openNotifications = useCallback(async () => {
    setIsSidebarOpen(false);
    try {
      const [notis, invites] = await Promise.all([notificationApi.unread(), invitationApi.list()]);
      setInvitations(invites);
      setModal({ type: 'notifications', notifications: notis });
      if (notis.length > 0) {
        await notificationApi.markAllRead();
        setNotifications([]);
      }
    } catch (err) {
      handleApiError(err);
    }
  }, [handleApiError]);

  const refreshInbox = useCallback(() => {
    loadInbox().catch(handleApiError);
  }, [loadInbox, handleApiError]);

  const handleRoomRead = useCallback((roomId) => {
    setRooms((prev) =>
      prev.some((r) => r.roomId === roomId && r.unreadCount > 0)
        ? prev.map((r) => (r.roomId === roomId ? { ...r, unreadCount: 0 } : r))
        : prev
    );
  }, []);

  const handleAcceptInvitation = useCallback(
    async (scheduleId, allowOverlap = false) => {
      await invitationApi.accept(scheduleId, allowOverlap);
      setInvitations((prev) => prev.filter((i) => i.scheduleId !== scheduleId));
      refreshSchedules();
    },
    [refreshSchedules]
  );

  const handleRejectInvitation = useCallback(async (scheduleId) => {
    await invitationApi.reject(scheduleId);
    setInvitations((prev) => prev.filter((i) => i.scheduleId !== scheduleId));
  }, []);

  if (!authChecked) return null;

  if (!user) {
    return <AuthModal onLoginSuccess={setUser} />;
  }

  const renderFriendList = () => (
    <>
      <MobileTopBar onToggleSidebar={openSidebar} />
      <FriendListModule
        friends={friends}
        loading={friendsLoading && friends.length === 0}
        onSelectFriend={openFriendCalendar}
        onAddFriend={() => setModal({ type: 'addFriend' })}
      />
    </>
  );

  const renderView = () => {
    if (currentView.startsWith('room-')) {
      const room = rooms.find((r) => `room-${r.roomId}` === currentView);
      if (!room) return null;
      return (
        <CompareRoom
          key={room.roomId}
          room={room}
          currentUserId={user.userId}
          invitations={invitations}
          onToggleSidebar={openSidebar}
          onError={handleApiError}
          onScheduleChanged={refreshSchedules}
          onInboxChanged={refreshInbox}
          onRoomRead={handleRoomRead}
          onAcceptInvitation={handleAcceptInvitation}
          onRejectInvitation={handleRejectInvitation}
        />
      );
    }

    switch (currentView) {
      case 'main':
        return (
          <CalendarMain
            key="main"
            currentUserId={user.userId}
            schedules={schedules}
            onOpenAddSchedule={openAddSchedule}
            onEditSchedule={openEditSchedule}
            onDeleteSchedule={openDeleteSchedule}
            onMoveSchedule={handleMoveSchedule}
            onMonthChange={handleMonthChange}
            onToggleSidebar={openSidebar}
          />
        );
      case 'weekly':
        return (
          <WeeklyCalendar
            key="weekly"
            currentUserId={user.userId}
            version={scheduleVersion}
            onAddSchedule={openAddSchedule}
            onEditSchedule={openEditSchedule}
            onReschedule={handleRescheduleSchedule}
            onMoveSchedule={handleMoveSchedule}
            onToggleSidebar={openSidebar}
            onError={handleApiError}
          />
        );
      case 'daily':
        return (
          <DailyPlanner
            key="daily"
            currentUserId={user.userId}
            version={scheduleVersion}
            onAddSchedule={openAddSchedule}
            onEditSchedule={openEditSchedule}
            onToggleSidebar={openSidebar}
            onError={handleApiError}
          />
        );
      case 'friendCalendar':
        if (selectedFriend) {
          return (
            <FriendCalendar
              key={`friend-${selectedFriend.userId}`}
              friend={selectedFriend}
              onToggleSidebar={openSidebar}
              onError={handleApiError}
              onDeleteFriend={(friend) => setModal({ type: 'deleteFriend', friend })}
            />
          );
        }
        return renderFriendList();
      case 'requests':
        return (
          <>
            <MobileTopBar onToggleSidebar={openSidebar} />
            <FriendRequests
              requests={requests}
              loading={requestsLoading && requests.length === 0}
              onAccept={handleAcceptFriend}
              onReject={handleRejectFriend}
            />
          </>
        );
      case 'friendList':
        return renderFriendList();
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        activeView={currentView}
        theme={theme}
        rooms={rooms}
        requestCount={requests.length}
        notificationCount={notifications.length + invitations.length}
        onMenuClick={handleMenuClick}
        onToggleTheme={toggleTheme}
        onLogout={openLogout}
        onOpenNotifications={openNotifications}
        onRoomSettings={openRoomSettings}
      />

      <main className="content-area">{renderView()}</main>

      {modal?.type === 'schedule' && (
        <ScheduleModal date={modal.date} schedule={modal.schedule} onClose={closeModal} onSave={handleSaveSchedule} />
      )}
      {modal?.type === 'rescheduleOverlap' && (
        <ConfirmModal
          title="일정 겹침"
          message={`${modal.message}\n겹치는 것을 확인했다면 그대로 옮길 수 있습니다.`}
          confirmLabel="확인했습니다"
          onConfirm={() => handleRescheduleSchedule(modal.schedule, modal.next, true)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'roomSettings' && (
        <RoomSettingsModal
          room={rooms.find((r) => r.roomId === modal.room.roomId) ?? modal.room}
          isHost={modal.room.hostId === user.userId}
          onClose={closeModal}
          onDelete={(r) => setModal({ type: 'deleteRoom', room: r })}
          onLeave={(r) => setModal({ type: 'leaveRoom', room: r })}
        />
      )}
      {modal?.type === 'deleteRoom' && (
        <ConfirmModal
          title="방 삭제하기"
          message={`'${modal.room.title}' 방을 삭제할까요?\n확정된 다인 일정은 각자 달력에 남고, 응답 대기 중인 초대는 취소됩니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={() => closeRoom(modal.room, 'delete')}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'leaveRoom' && (
        <ConfirmModal
          title="방 나가기"
          message={`'${modal.room.title}' 방에서 나갈까요?\n아직 응답하지 않은 이 방의 일정 초대는 거절됩니다.`}
          confirmLabel="나가기"
          danger
          onConfirm={() => closeRoom(modal.room, 'leave')}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'logout' && (
        <ConfirmModal
          title="로그아웃"
          message="로그아웃 하시겠습니까?"
          confirmLabel="로그아웃"
          onConfirm={handleLogout}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'deleteSchedule' && (
        <ConfirmModal
          title="일정 삭제하기"
          message={
            modal.schedule.roomId != null
              ? `'${modal.schedule.title}' 다인 일정을 삭제할까요? 초대한 사람들에게 취소 알림이 갑니다.`
              : `'${modal.schedule.title}' 일정을 삭제할까요? 삭제한 일정은 되돌릴 수 없습니다.`
          }
          confirmLabel="삭제"
          danger
          onConfirm={() => handleDeleteSchedule(modal.schedule.id)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'moveOverlap' && (
        <ConfirmModal
          title="일정 겹침"
          message={`${modal.message}\n겹치는 것을 확인했다면 그대로 옮길 수 있습니다.`}
          confirmLabel="확인했습니다"
          onConfirm={() => handleMoveSchedule(modal.id, modal.date, true)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'profile' && (
        <ProfileEditModal user={user} onClose={closeProfile} onSave={handleSaveProfile} onPreviewColor={setPreviewColor}
          onPreviewFont={setPreviewFont}
          onWithdraw={handleWithdraw} />
      )}
      {modal?.type === 'addFriend' && <AddFriendModal onClose={closeModal} onSubmit={friendApi.request} />}
      {modal?.type === 'deleteFriend' && (
        <ConfirmModal
          title="친구 삭제하기"
          message={`${modal.friend.nickname}님을 친구 목록에서 삭제할까요? 서로의 일정을 더 이상 볼 수 없습니다.`}
          confirmLabel="삭제"
          danger
          onConfirm={() => handleDeleteFriend(modal.friend)}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'room' && (
        <RoomModal onClose={closeModal} onCreate={handleCreateRoom} onJoin={handleJoinRoom} onOpenRoom={openRoom} />
      )}
      {modal?.type === 'notifications' && (
        <NotificationPanel
          invitations={invitations}
          notifications={modal.notifications}
          onAccept={handleAcceptInvitation}
          onReject={handleRejectInvitation}
          onGoRequests={() => {
            setModal(null);
            setCurrentView('requests');
          }}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'message' && (
        <ModalShell title="알림" onClose={closeModal}>
          <p className="confirm-text">{modal.message}</p>
          <div className="actions actions--top">
            <button type="button" className="cyber-button" onClick={closeModal} autoFocus>
              확인
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
