package com.hour.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hour.common.ApiException;
import com.hour.room.RoomService;
import com.hour.user.User;
import com.hour.user.UserMapper;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ChatServiceTest {

    private FakeChatMapper chatMapper;
    private List<Object> events;
    private RoomService roomService;
    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatMapper = new FakeChatMapper();
        chatMapper.nicknames.put(1L, "나");
        chatMapper.nicknames.put(2L, "민지");
        events = new ArrayList<>();
        UserMapper userMapper = mock(UserMapper.class);
        User me = new User();
        me.setNickname("나");
        when(userMapper.findById(1L)).thenReturn(me);
        roomService = mock(RoomService.class);
        doThrow(ApiException.forbidden("들어가 있는 방만 볼 수 있습니다."))
                .when(roomService).assertParticipant(anyLong(), eq(9L));
        ChatPoster poster = new ChatPoster(chatMapper, userMapper, events::add);
        chatService = new ChatService(chatMapper, poster, new ChatRateLimiter(), roomService);
    }

    @Test
    void sendTrimsSavesMarksReadAndPublishes() {
        ChatDto.Message sent = chatService.send(1L, 1L, "  안녕  ");

        assertThat(sent.content()).isEqualTo("안녕");
        assertThat(sent.type()).isEqualTo(MessageType.TEXT);
        assertThat(sent.nickname()).isEqualTo("나");
        assertThat(chatMapper.lastRead).containsEntry("1:1", sent.id());
        assertThat(events).containsExactly(new ChatMessageCreated(1L, sent.id()));
    }

    @Test
    void sendRejectsBlankTooLongAndOutsiders() {
        assertThatThrownBy(() -> chatService.send(1L, 1L, "  \n ")).hasMessageContaining("메시지를 입력");
        assertThatThrownBy(() -> chatService.send(1L, 1L, "가".repeat(1001))).hasMessageContaining("1000자");
        assertThatThrownBy(() -> chatService.send(9L, 1L, "hi")).hasMessageContaining("들어가 있는 방만");
    }

    @Test
    void pagesMessagesByCursor() {
        for (int i = 0; i < 120; i++) {
            RoomMessage m = new RoomMessage();
            m.setRoomId(1L);
            m.setUserId(2L);
            m.setMsgType(MessageType.TEXT);
            m.setContent("m" + i);
            chatMapper.insert(m);
        }

        ChatDto.Page latest = chatService.getMessages(1L, 1L, null, null);
        assertThat(latest.messages()).hasSize(50);
        assertThat(latest.messages().get(0).id()).isEqualTo(71L);
        assertThat(latest.messages().get(49).id()).isEqualTo(120L);
        assertThat(latest.hasMore()).isTrue();

        ChatDto.Page oldest = chatService.getMessages(1L, 1L, 21L, null);
        assertThat(oldest.messages()).hasSize(20);
        assertThat(oldest.messages().get(0).id()).isEqualTo(1L);
        assertThat(oldest.hasMore()).isFalse();

        ChatDto.Page newer = chatService.getMessages(1L, 1L, null, 100L);
        assertThat(newer.messages()).extracting(ChatDto.Message::id).startsWith(101L).endsWith(120L);
        assertThat(newer.hasMore()).isFalse();

        assertThatThrownBy(() -> chatService.getMessages(1L, 1L, 5L, 5L)).hasMessageContaining("함께 쓸 수 없습니다");
    }
}
