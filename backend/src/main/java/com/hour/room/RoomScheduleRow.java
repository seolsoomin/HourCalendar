package com.hour.room;

import com.hour.schedule.ScheduleStatus;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoomScheduleRow {

    private Long scheduleId;
    private Long ownerId;
    private Long participantId;
    private String nickname;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Boolean isSecret;
    private ScheduleStatus status;
}
