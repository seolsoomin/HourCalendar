package com.hour.chat;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class ChatBroadcaster {

    public static final String TOPIC_PREFIX = "/topic/rooms/";

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onMessageCreated(ChatMessageCreated event) {
        try {
            messagingTemplate.convertAndSend(TOPIC_PREFIX + event.roomId(), String.valueOf(event.messageId()));
        } catch (RuntimeException e) {
            log.warn("채팅 알림 전송 실패: room={}, message={}", event.roomId(), event.messageId(), e);
        }
    }
}
