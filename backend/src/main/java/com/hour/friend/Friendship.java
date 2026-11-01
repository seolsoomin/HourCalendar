package com.hour.friend;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Friendship {

    private Long friendshipId;
    private Long userId;
    private Long friendId;
    private FriendStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
