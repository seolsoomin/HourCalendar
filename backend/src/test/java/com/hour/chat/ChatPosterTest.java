package com.hour.chat;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;

class ChatPosterTest {

    @Test
    void describesSameDayAndMultiDayRanges() {
        assertThat(ChatPoster.describe(LocalDateTime.of(2026, 10, 24, 14, 0), LocalDateTime.of(2026, 10, 24, 17, 0)))
                .isEqualTo("10/24(토) 14:00–17:00");
        assertThat(ChatPoster.describe(LocalDateTime.of(2026, 10, 25, 21, 0), LocalDateTime.of(2026, 10, 26, 0, 0)))
                .isEqualTo("10/25(일) 21:00 – 10/26 00:00");
    }
}
