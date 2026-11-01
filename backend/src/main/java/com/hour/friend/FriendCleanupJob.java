package com.hour.friend;

import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class FriendCleanupJob {

    private static final int KEEP_DAYS = 30;

    private final FriendMapper friendMapper;

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    @Transactional
    public void deleteStaleFriendships() {
        int deleted = friendMapper.deleteStale(LocalDateTime.now().minusDays(KEEP_DAYS));
        if (deleted > 0) {
            log.info("오래된 거절/삭제 친구 관계 {}건 정리", deleted);
        }
    }
}
