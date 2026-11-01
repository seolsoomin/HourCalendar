package com.hour.schedule;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ScheduleParticipant {

    private Long scheduleId;
    private Long userId;
    private String nickname;
    private String status;
}
