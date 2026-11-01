package com.hour.chat;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ChatRateLimiterTest {

    @Test
    void limitsBurstsPerUserWithinWindow() {
        ChatRateLimiter limiter = new ChatRateLimiter();
        for (int i = 0; i < ChatRateLimiter.MAX_MESSAGES; i++) {
            limiter.check(1L, 1_000 + i);
        }

        assertThatThrownBy(() -> limiter.check(1L, 1_009)).hasMessageContaining("너무 빨리");
        assertThatCode(() -> limiter.check(2L, 1_009)).doesNotThrowAnyException();
        assertThatCode(() -> limiter.check(1L, 1_000 + ChatRateLimiter.WINDOW_MILLIS)).doesNotThrowAnyException();
    }
}
