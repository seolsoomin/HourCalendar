package com.hour.room;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Room {

    private Long roomId;
    private String roomCode;
    private Long hostId;
    private String roomTitle;
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;
    private Integer unreadCount;
}
