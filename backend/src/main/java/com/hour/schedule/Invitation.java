package com.hour.schedule;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Invitation {

    private Long scheduleId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String memo;
    private Long roomId;
    private String roomTitle;
    private Long ownerId;
    private String ownerNickname;
}
