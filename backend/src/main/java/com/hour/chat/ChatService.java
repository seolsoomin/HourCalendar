package com.hour.chat;

import com.hour.common.ApiException;
import com.hour.room.RoomService;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChatService {

    public static final int MAX_LENGTH = 1000;
    static final int PAGE_SIZE = 50;

    private final ChatMapper chatMapper;
    private final ChatPoster chatPoster;
    private final ChatRateLimiter rateLimiter;
    private final RoomService roomService;

    public ChatDto.Page getMessages(Long userId, Long roomId, Long before, Long after) {
        roomService.assertParticipant(roomId, userId);
        if (before != null && after != null) {
            throw ApiException.badRequest("before와 after는 함께 쓸 수 없습니다.");
        }

        if (after != null) {
            List<RoomMessage> rows = chatMapper.findAfter(roomId, after, PAGE_SIZE + 1);
            boolean hasMore = rows.size() > PAGE_SIZE;
            return toPage(hasMore ? rows.subList(0, PAGE_SIZE) : rows, hasMore);
        }

        List<RoomMessage> rows = before == null
                ? chatMapper.findLatest(roomId, PAGE_SIZE + 1)
                : chatMapper.findBefore(roomId, before, PAGE_SIZE + 1);
        boolean hasMore = rows.size() > PAGE_SIZE;
        List<RoomMessage> page = new ArrayList<>(hasMore ? rows.subList(0, PAGE_SIZE) : rows);
        Collections.reverse(page);
        return toPage(page, hasMore);
    }

    @Transactional
    public ChatDto.Message send(Long userId, Long roomId, String rawContent) {
        roomService.assertParticipant(roomId, userId);
        String content = rawContent == null ? "" : rawContent.strip();
        if (content.isEmpty()) {
            throw ApiException.badRequest("메시지를 입력해 주세요.");
        }
        if (content.length() > MAX_LENGTH) {
            throw ApiException.badRequest("메시지는 1000자까지 보낼 수 있습니다.");
        }
        rateLimiter.check(userId);
        RoomMessage saved = chatPoster.text(roomId, userId, content);
        chatMapper.markRead(roomId, userId, saved.getMessageId());
        return ChatDto.Message.from(saved);
    }

    @Transactional
    public void markRead(Long userId, Long roomId, Long messageId) {
        roomService.assertParticipant(roomId, userId);
        chatMapper.markRead(roomId, userId, messageId);
    }

    private static ChatDto.Page toPage(List<RoomMessage> rows, boolean hasMore) {
        return new ChatDto.Page(rows.stream().map(ChatDto.Message::from).toList(), hasMore);
    }
}
