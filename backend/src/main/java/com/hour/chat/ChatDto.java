package com.hour.chat;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class ChatDto {

    private ChatDto() {}

    public record Send(
            @NotBlank(message = "메시지를 입력해 주세요.")
            @Size(max = ChatService.MAX_LENGTH, message = "메시지는 1000자까지 보낼 수 있습니다.")
            String content
    ) {}

    public record Read(@NotNull(message = "메시지 번호가 필요합니다.") Long messageId) {}

    public record Message(
            Long id,
            Long roomId,
            MessageType type,
            Long userId,
            String nickname,
            String profileImage,
            String content,
            Long refId,
            LocalDate date,
            LocalDate endDate,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            LocalDateTime createdAt
    ) {
        public static Message from(RoomMessage m) {
            LocalDateTime start = m.getStartTime();
            LocalDateTime end = m.getEndTime();
            return new Message(m.getMessageId(), m.getRoomId(), m.getMsgType(), m.getUserId(), m.getNickname(),
                    m.getProfileImage(), m.getContent(), m.getRefId(),
                    start == null ? null : start.toLocalDate(),
                    end == null ? null : end.toLocalDate(),
                    start == null ? null : start.toLocalTime(),
                    end == null ? null : end.toLocalTime(),
                    m.getCreatedAt());
        }
    }

    public record Page(List<Message> messages, boolean hasMore) {}
}
