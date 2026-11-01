import React, { memo, useCallback, useMemo, useState } from 'react';

const isChildActive = (child, activeView) =>
  child.key === activeView || Boolean(child.activeFor?.includes(activeView));

function buildMenu(rooms, requestCount) {
  return [
    {
      id: 'mine',
      label: '내 일정',
      children: [
        { key: 'main', label: '달력' },
        { key: 'weekly', label: '주간 일정' },
        { key: 'daily', label: '오늘의 일정표' },
      ],
    },
    {
      id: 'friends',
      label: '친구',
      children: [
        { key: 'friendList', label: '친구 목록', activeFor: ['friendCalendar'] },
        { key: 'requests', label: '받은 요청', badge: requestCount },
      ],
    },
    {
      id: 'comparing',
      label: '일정 비교',
      children: [
        ...rooms.map((r) => ({ key: `room-${r.roomId}`, label: r.title, badge: r.unreadCount, room: r })),
        { key: 'roomAdd', label: '+ 방 만들기 / 입장', isAction: true },
      ],
    },
  ];
}

function Sidebar({
  user,
  isOpen,
  activeView,
  theme,
  rooms,
  requestCount,
  notificationCount,
  onMenuClick,
  onToggleTheme,
  onLogout,
  onOpenNotifications,
  onRoomSettings,
}) {
  const menu = useMemo(() => buildMenu(rooms, requestCount), [rooms, requestCount]);

  const [openFolders, setOpenFolders] = useState(() => new Set(['mine', 'friends', 'comparing']));

  const toggleFolder = useCallback((id) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="box-inner id-card">
        <div className="id-card-header">
          <span>내 프로필</span>
          <button
            type="button"
            className="icon-button"
            onClick={() => onMenuClick('editProfile')}
            aria-label="프로필 편집"
          >
            <span className="cyber-icon icon-gear no-margin" aria-hidden="true" />
          </button>
        </div>
        <div className="divider divider--spaced" />

        <div className="id-card-body">
          <div className="box-inner profile-img-box">
            {user?.profileImage ? (
              <img className="profile-img" src={user.profileImage} alt="" />
            ) : (
              <div className="profile-img-icon" />
            )}
          </div>
          <div className="id-card-info">
            <div>{user?.nickname || '[ 닉네임 ]'}</div>
            <div>{user?.loginId || '[ 아이디 ]'}</div>
            <div>{user?.age != null ? `${user.age}세` : '[ 나이 ]'}</div>
            <div>{user?.birth || '[ 생일 ]'}</div>
          </div>
        </div>
      </div>

      <nav className="box-inner folder-box">
        <div className="folder-title">메뉴</div>

        {menu.map((folder, idx) => {
          const hasChildren = Boolean(folder.children);
          const folderOpen = openFolders.has(folder.id);
          const isActive = Boolean(folder.key) && activeView === folder.key;
          const childrenId = `folder-${folder.id}`;

          const handleFolderClick = () => {
            if (folder.key) onMenuClick(folder.key);
            if (hasChildren) toggleFolder(folder.id);
          };

          const classes = ['menu-item', 'menu-folder'];
          if (idx > 0) classes.push('menu-item-gap');
          if (isActive) classes.push('active');

          return (
            <div key={folder.id} className="menu-group">
              <button
                type="button"
                className={classes.join(' ')}
                onClick={handleFolderClick}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={hasChildren ? folderOpen : undefined}
                aria-controls={hasChildren ? childrenId : undefined}
              >
                <span className="cyber-icon icon-folder" aria-hidden="true" />
                {folder.label}
              </button>

              {hasChildren && (
                <div id={childrenId} className={`folder-children ${folderOpen ? 'open' : ''}`}>
                  <div className="folder-children-inner">
                    {folder.children.map((child) => {
                      const childActive = isChildActive(child, activeView);
                      const classNames = ['menu-item', 'menu-item-sub'];
                      if (childActive) classNames.push('active');
                      if (child.isAction) classNames.push('menu-item-action');
                      const item = (
                        <button
                          type="button"
                          key={child.key}
                          className={classNames.join(' ')}
                          onClick={() => onMenuClick(child.key)}
                          aria-current={childActive ? 'page' : undefined}
                        >
                          {!child.isAction && <span className="cyber-icon icon-document" aria-hidden="true" />}
                          <span className="menu-label">{child.label}</span>
                          {child.badge > 0 && <span className="count-badge">{child.badge}</span>}
                        </button>
                      );
                      if (!child.room) return item;
                      return (
                        <div key={child.key} className="menu-item-row">
                          {item}
                          <button
                            type="button"
                            className="icon-button room-settings-button"
                            onClick={() => onRoomSettings?.(child.room)}
                            aria-label={`${child.label} 방 설정`}
                            title="방 설정"
                          >
                            <span className="cyber-icon icon-gear no-margin" aria-hidden="true" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="sidebar-bottom">
          <button
            type="button"
            className="icon-button sidebar-icon-button"
            onClick={onOpenNotifications}
            aria-label={notificationCount > 0 ? `알림 ${notificationCount}개` : '알림'}
            title={notificationCount > 0 ? `새 알림 ${notificationCount}개` : '알림'}
          >
            <span
              className={`cyber-icon no-margin ${notificationCount > 0 ? 'icon-bell-dot' : 'icon-bell'}`}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="icon-button sidebar-icon-button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            <span className="cyber-icon icon-theme no-margin" aria-hidden="true" />
          </button>
          <button type="button" className="logout-button" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </nav>
    </aside>
  );
}

export default memo(Sidebar);
