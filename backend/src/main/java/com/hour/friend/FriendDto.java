package com.hour.friend;

import com.hour.user.User;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;

public final class FriendDto {

    private FriendDto() {}

    public record Create(@NotBlank(message = "친구의 아이디를 입력해 주세요.") String loginId) {}

    public record Friend(
            Long userId,
            String loginId,
            String nickname,
            String profileImage,
            LocalDate birth,
            Integer age
    ) {
        public static Friend from(User u) {
            return new Friend(u.getUserId(), u.getLoginId(), u.getNickname(), u.getProfileImage(),
                    u.getBirthDate(), u.getAge());
        }
    }

    public record Received(
            Long friendshipId,
            Long userId,
            String loginId,
            String nickname,
            String profileImage,
            LocalDateTime requestedAt
    ) {
        public static Received from(ReceivedRequest r) {
            return new Received(r.getFriendshipId(), r.getUserId(), r.getLoginId(), r.getNickname(),
                    r.getProfileImage(), r.getCreatedAt());
        }
    }
}
