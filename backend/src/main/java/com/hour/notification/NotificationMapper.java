package com.hour.notification;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface NotificationMapper {

    int insert(@Param("userId") Long userId,
               @Param("type") NotificationType type,
               @Param("refId") Long refId,
               @Param("message") String message);

    List<Notification> findUnread(Long userId);

    int markRead(@Param("notificationId") Long notificationId, @Param("userId") Long userId);

    int markAllRead(Long userId);
}
