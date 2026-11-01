package com.hour.friend;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReceivedRequest {

    private Long friendshipId;
    private Long userId;
    private String loginId;
    private String nickname;
    private String profileImage;
    private LocalDateTime createdAt;
}
