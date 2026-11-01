import React from 'react';

export default function FriendListModule({ friends, loading, onSelectFriend, onAddFriend }) {
  return (
    <section className="box-border panel friend-panel">
      <div className="panel-title-row panel-title-row--actions">
        <span>친구 목록</span>
        <button type="button" className="cyber-button btn-sm" onClick={onAddFriend}>
          친구 추가
        </button>
      </div>

      {loading && <p className="empty-text">불러오는 중...</p>}
      {!loading && friends.length === 0 && (
        <p className="empty-text">아직 친구가 없습니다. 친구 추가 버튼으로 친구의 아이디를 입력해 보세요.</p>
      )}

      <div className="friend-grid">
        {friends.map((f) => (
          <button
            type="button"
            key={f.userId}
            className="box-border friend-card"
            onClick={() => onSelectFriend(f)}
            aria-label={`${f.nickname}의 일정 보기`}
          >
            <div className="box-inner profile-img-box profile-img-box--lg">
              {f.profileImage ? (
                <img className="profile-img" src={f.profileImage} alt="" />
              ) : (
                <div className="profile-img-icon" />
              )}
            </div>
            <div className="friend-info">
              <div>{f.nickname}</div>
              <div>{f.loginId}</div>
              <div>{f.age != null ? `${f.age}세` : '[ 나이 ]'}</div>
              <div>{f.birth || '[ 생일 ]'}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
