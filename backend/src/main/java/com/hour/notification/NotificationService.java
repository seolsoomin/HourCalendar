package com.hour.notification;

import com.hour.common.ApiException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;

    public void send(Long userId, NotificationType type, Long refId, String message) {
        notificationMapper.insert(userId, type, refId, message);
    }

    public List<Notification> getUnread(Long userId) {
        return notificationMapper.findUnread(userId);
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        if (notificationMapper.markRead(notificationId, userId) == 0) {
            throw ApiException.notFound("알림을 찾을 수 없습니다.");
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        notificationMapper.markAllRead(userId);
    }
}
