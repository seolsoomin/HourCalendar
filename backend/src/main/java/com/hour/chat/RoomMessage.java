package com.hour.chat;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomMessage {

    private Long messageId;
    private Long roomId;
    private Long userId;
    private String nickname;
    private String profileImage;
    private MessageType msgType;
    private String content;
    private Long refId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
}
