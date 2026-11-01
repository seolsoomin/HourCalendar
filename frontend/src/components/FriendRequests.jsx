import React, { useState } from 'react';

export default function FriendRequests({ requests, loading, onAccept, onReject }) {
  const [busyId, setBusyId] = useState(null);

  const respond = async (fn, friendshipId) => {
    setBusyId(friendshipId);
    try {
      await fn(friendshipId);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="box-border panel friend-panel">
      <div className="panel-title-row">받은 친구 요청</div>

      {loading && <p className="empty-text">불러오는 중...</p>}
      {!loading && requests.length === 0 && <p className="empty-text">받은 친구 요청이 없습니다.</p>}

      <ul className="request-list">
        {requests.map((r) => (
          <li key={r.friendshipId} className="box-inner request-item">
            <div className="box-inner profile-img-box">
              {r.profileImage ? <img className="profile-img" src={r.profileImage} alt="" /> : <div className="profile-img-icon" />}
            </div>
            <div className="request-info">
              <div>{r.nickname}</div>
              <div className="request-sub">{r.loginId}</div>
            </div>
            <div className="request-actions">
              <button
                type="button"
                className="cyber-button btn-sm"
                disabled={busyId === r.friendshipId}
                onClick={() => respond(onAccept, r.friendshipId)}
              >
                승낙
              </button>
              <button
                type="button"
                className="cyber-button btn-sm btn-danger"
                disabled={busyId === r.friendshipId}
                onClick={() => respond(onReject, r.friendshipId)}
              >
                거절
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
