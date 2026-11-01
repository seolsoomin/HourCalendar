package com.hour.chat;

import com.hour.common.ApiException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ChatRateLimiter {

    static final int MAX_MESSAGES = 8;
    static final long WINDOW_MILLIS = 10_000;

    private final Map<Long, Deque<Long>> sentAt = new ConcurrentHashMap<>();

    public void check(Long userId) {
        check(userId, System.currentTimeMillis());
    }

    void check(Long userId, long now) {
        Deque<Long> times = sentAt.computeIfAbsent(userId, id -> new ArrayDeque<>());
        synchronized (times) {
            while (!times.isEmpty() && now - times.peekFirst() >= WINDOW_MILLIS) {
                times.pollFirst();
            }
            if (times.size() >= MAX_MESSAGES) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "메시지를 너무 빨리 보내고 있어요. 잠시 후 다시 보내 주세요.");
            }
            times.addLast(now);
        }
    }
}
