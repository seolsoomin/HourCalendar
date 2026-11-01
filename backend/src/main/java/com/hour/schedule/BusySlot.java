package com.hour.schedule;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class BusySlot {

    private Long userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
