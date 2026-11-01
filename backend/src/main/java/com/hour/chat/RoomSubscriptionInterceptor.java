package com.hour.chat;

import com.hour.auth.LoginUser;
import com.hour.room.Room;
import com.hour.room.RoomMapper;
import java.security.Principal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoomSubscriptionInterceptor implements ChannelInterceptor {

    private static final Pattern ROOM_TOPIC = Pattern.compile("^" + ChatBroadcaster.TOPIC_PREFIX + "(\\d+)$");

    private final RoomMapper roomMapper;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }
        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT) {
            loginUser(accessor.getUser());
        } else if (command == StompCommand.SUBSCRIBE) {
            checkRoomAccess(loginUser(accessor.getUser()), accessor.getDestination());
        } else if (command == StompCommand.SEND) {
            throw new MessagingException("메시지는 HTTP API로 보내 주세요.");
        }
        return message;
    }

    static LoginUser loginUser(Principal principal) {
        if (principal instanceof Authentication auth && auth.getPrincipal() instanceof LoginUser user) {
            return user;
        }
        throw new MessagingException("로그인이 필요합니다.");
    }

    private void checkRoomAccess(LoginUser user, String destination) {
        Matcher matcher = ROOM_TOPIC.matcher(destination == null ? "" : destination);
        if (!matcher.matches()) {
            throw new MessagingException("구독할 수 없는 주소입니다.");
        }
        Long roomId = Long.valueOf(matcher.group(1));
        Room room = roomMapper.findById(roomId);
        if (room == null || room.getDeletedAt() != null || roomMapper.countParticipant(roomId, user.userId()) == 0) {
            throw new MessagingException("들어가 있는 방만 볼 수 있습니다.");
        }
    }
}
