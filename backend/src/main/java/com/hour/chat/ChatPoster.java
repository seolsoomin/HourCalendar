package com.hour.chat;

import com.hour.user.User;
import com.hour.user.UserMapper;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ChatPoster {

    private static final DateTimeFormatter MD = DateTimeFormatter.ofPattern("M/d");
    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    private final ChatMapper chatMapper;
    private final UserMapper userMapper;
    private final ApplicationEventPublisher events;

    public RoomMessage text(Long roomId, Long userId, String content) {
        return save(roomId, userId, MessageType.TEXT, content, null, null, null);
    }

    public RoomMessage invite(Long roomId, Long ownerId, Long scheduleId, String title,
                              LocalDateTime start, LocalDateTime end) {
        return save(roomId, ownerId, MessageType.INVITE, title, scheduleId, start, end);
    }

    public RoomMessage system(Long roomId, String content) {
        return save(roomId, null, MessageType.SYSTEM, content, null, null, null);
    }

    public RoomMessage roomCreated(Long roomId, Long userId) {
        return system(roomId, nickname(userId) + "님이 방을 만들었어요.");
    }

    public RoomMessage memberJoined(Long roomId, Long userId) {
        return system(roomId, nickname(userId) + "님이 들어왔어요.");
    }

    public RoomMessage memberLeft(Long roomId, Long userId) {
        return system(roomId, nickname(userId) + "님이 나갔어요.");
    }

    public static String describe(LocalDateTime start, LocalDateTime end) {
        String head = start.format(MD) + "(" + start.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.KOREAN) + ") "
                + start.format(HM);
        if (end.toLocalDate().equals(start.toLocalDate())) {
            return head + "–" + end.format(HM);
        }
        return head + " – " + end.format(MD) + " " + end.format(HM);
    }

    private String nickname(Long userId) {
        User user = userMapper.findById(userId);
        return user == null ? "알 수 없는 사용자" : user.getNickname();
    }

    private RoomMessage save(Long roomId, Long userId, MessageType type, String content, Long refId,
                             LocalDateTime start, LocalDateTime end) {
        RoomMessage m = new RoomMessage();
        m.setRoomId(roomId);
        m.setUserId(userId);
        m.setMsgType(type);
        m.setContent(content);
        m.setRefId(refId);
        m.setStartTime(start);
        m.setEndTime(end);
        chatMapper.insert(m);
        events.publishEvent(new ChatMessageCreated(roomId, m.getMessageId()));
        return chatMapper.findById(m.getMessageId());
    }
}
