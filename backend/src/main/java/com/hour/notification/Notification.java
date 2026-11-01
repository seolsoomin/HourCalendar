package com.hour.notification;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Notification {

    private Long notificationId;
    private Long userId;
    private NotificationType notiType;
    private Long refId;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
