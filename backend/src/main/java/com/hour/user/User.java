package com.hour.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class User {

    private Long userId;
    private String loginId;
    private String passwordHash;
    private String email;
    private String nickname;
    private LocalDate birthDate;
    private String profileImage;
    private String bgImage;
    private String bgColor;
    private String pointColor;
    private String font;
    private LocalDateTime createdAt;

    public Integer getAge() {
        return birthDate == null ? null : Period.between(birthDate, LocalDate.now()).getYears();
    }
}
