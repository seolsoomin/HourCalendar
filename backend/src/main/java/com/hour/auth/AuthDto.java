package com.hour.auth;

import com.hour.auth.email.EmailPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AuthDto {

    private AuthDto() {}

    private static final String COLOR = "^#[0-9A-Fa-f]{6}$";

    public record Signup(
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식이 아닙니다.") @Size(max = 100)
            String email,

            @NotBlank(message = "아이디를 입력해 주세요.") @Size(min = 4, max = 50, message = "아이디는 4~50자입니다.")
            @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "아이디는 영문, 숫자, _ 만 사용할 수 있습니다.")
            String loginId,

            @NotBlank(message = "비밀번호를 입력해 주세요.") @Size(min = 8, max = 64, message = "비밀번호는 8~64자입니다.")
            String password,

            @NotBlank(message = "닉네임을 입력해 주세요.") @Size(max = 50)
            String nickname,

            @Size(max = 500) String profileImage,
            @Size(max = 500) String bgImage,
            @Pattern(regexp = COLOR, message = "색상은 #RRGGBB 형식입니다.") String bgColor,
            @Pattern(regexp = COLOR, message = "색상은 #RRGGBB 형식입니다.") String pointColor
    ) {}

    public record Login(
            @NotBlank(message = "아이디를 입력해 주세요.") String loginId,
            @NotBlank(message = "비밀번호를 입력해 주세요.") String password
    ) {}

    public record IdCheck(boolean available) {}

    public record SendCode(
            @NotBlank(message = "이메일을 입력해 주세요.") @Email(message = "이메일 형식이 아닙니다.") @Size(max = 100)
            String email,
            @NotNull(message = "인증 용도가 없습니다.") EmailPurpose purpose,
            String loginId
    ) {}

    public record VerifyCode(
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotNull(message = "인증 용도가 없습니다.") EmailPurpose purpose,
            @NotBlank(message = "인증번호를 입력해 주세요.") @Pattern(regexp = "^\\d{6}$", message = "인증번호는 숫자 6자리입니다.")
            String code
    ) {}

    public record FindId(
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotBlank(message = "인증번호를 입력해 주세요.") @Pattern(regexp = "^\\d{6}$", message = "인증번호는 숫자 6자리입니다.")
            String code
    ) {}

    public record FoundId(String loginId) {}

    public record ResetPassword(
            @NotBlank(message = "아이디를 입력해 주세요.") String loginId,
            @NotBlank(message = "이메일을 입력해 주세요.") String email,
            @NotBlank(message = "새 비밀번호를 입력해 주세요.") @Size(min = 8, max = 64, message = "비밀번호는 8~64자입니다.")
            String newPassword
    ) {}
}
