package com.hour.schedule;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Schedule {

    private Long scheduleId;
    private Long userId;
    private Long roomId;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String memo;
    private Boolean isSecret;
    private Boolean showInCompare;
    private ScheduleStatus status;
    private LocalDateTime createdAt;
}
