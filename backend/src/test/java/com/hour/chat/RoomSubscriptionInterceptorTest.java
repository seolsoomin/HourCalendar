package com.hour.chat;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.hour.auth.LoginUser;
import com.hour.room.Room;
import com.hour.room.RoomMapper;
import java.security.Principal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

class RoomSubscriptionInterceptorTest {

    private final Principal me = UsernamePasswordAuthenticationToken.authenticated(new LoginUser(1L, "me"), null, List.of());
    private RoomSubscriptionInterceptor interceptor;

    @BeforeEach
    void setUp() {
        RoomMapper roomMapper = mock(RoomMapper.class);
        Room open = new Room();
        open.setRoomId(1L);
        when(roomMapper.findById(1L)).thenReturn(open);
        when(roomMapper.countParticipant(1L, 1L)).thenReturn(1);
        Room other = new Room();
        other.setRoomId(2L);
        when(roomMapper.findById(2L)).thenReturn(other);
        interceptor = new RoomSubscriptionInterceptor(roomMapper);
    }

    private Message<byte[]> frame(StompCommand command, Principal user, String destination) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setUser(user);
        if (destination != null) {
            accessor.setDestination(destination);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void connectNeedsLogin() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.CONNECT, null, null), null))
                .isInstanceOf(MessagingException.class);
        assertThatCode(() -> interceptor.preSend(frame(StompCommand.CONNECT, me, null), null)).doesNotThrowAnyException();
    }

    @Test
    void subscribeOnlyToOwnRooms() {
        assertThatCode(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, me, "/topic/rooms/1"), null))
                .doesNotThrowAnyException();
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, me, "/topic/rooms/2"), null))
                .isInstanceOf(MessagingException.class);
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, me, "/topic/rooms/9"), null))
                .isInstanceOf(MessagingException.class);
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SUBSCRIBE, me, "/topic/other"), null))
                .isInstanceOf(MessagingException.class);
    }

    @Test
    void clientSendIsRejected() {
        assertThatThrownBy(() -> interceptor.preSend(frame(StompCommand.SEND, me, "/app/rooms/1"), null))
                .isInstanceOf(MessagingException.class);
    }
}
