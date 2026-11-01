package com.hour.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class UserDto {

    private UserDto() {}

    public record Me(
            Long userId,
            String loginId,
            String email,
            String nickname,
            LocalDate birth,
            Integer age,
            String profileImage,
            String bgImage,
            String bgColor,
            String pointColor,
            String font
    ) {
        public static Me from(User u) {
            return new Me(u.getUserId(), u.getLoginId(), u.getEmail(), u.getNickname(), u.getBirthDate(),
                    u.getAge(), u.getProfileImage(), u.getBgImage(), u.getBgColor(), u.getPointColor(), u.getFont());
        }
    }

    public record Withdraw(@NotBlank(message = "비밀번호를 입력해 주세요.") String password) {}

    public record ProfileUpdate(
            @NotBlank(message = "닉네임을 입력해 주세요.") @Size(max = 50) String nickname,
            @Past(message = "생일은 오늘 이전이어야 합니다.") LocalDate birth,
            @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "색상은 #RRGGBB 형식입니다.") String pointColor,
            @Pattern(regexp = "^[a-z0-9-]{1,30}$", message = "글꼴 값이 올바르지 않습니다.") String font
    ) {}
}
