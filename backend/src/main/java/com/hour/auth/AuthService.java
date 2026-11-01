package com.hour.auth;

import com.hour.auth.email.EmailPurpose;
import com.hour.auth.email.EmailVerificationService;
import com.hour.common.ApiException;
import com.hour.user.User;
import com.hour.user.UserDto;
import com.hour.user.UserMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String DEFAULT_BG_COLOR = "#111111";
    private static final String DEFAULT_POINT_COLOR = "#66FFFF";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;

    public boolean isLoginIdAvailable(String loginId) {
        return userMapper.countByLoginId(loginId) == 0;
    }

    @Transactional
    public UserDto.Me signup(AuthDto.Signup req) {
        String email = EmailVerificationService.normalize(req.email());
        emailVerificationService.requireVerified(email, EmailPurpose.SIGNUP);
        if (!isLoginIdAvailable(req.loginId())) {
            throw ApiException.conflict("이미 사용 중인 아이디입니다.");
        }
        if (!userMapper.findByEmail(email).isEmpty()) {
            throw ApiException.conflict("이미 가입된 이메일입니다.");
        }

        User user = new User();
        user.setLoginId(req.loginId());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setEmail(email);
        user.setNickname(req.nickname().trim());
        user.setProfileImage(blankToNull(req.profileImage()));
        user.setBgImage(blankToNull(req.bgImage()));
        user.setBgColor(StringUtils.hasText(req.bgColor()) ? req.bgColor() : DEFAULT_BG_COLOR);
        user.setPointColor(StringUtils.hasText(req.pointColor()) ? req.pointColor() : DEFAULT_POINT_COLOR);
        userMapper.insert(user);
        emailVerificationService.consume(email, EmailPurpose.SIGNUP);

        return UserDto.Me.from(userMapper.findById(user.getUserId()));
    }

    public UserDto.Me authenticate(AuthDto.Login req) {
        User user = userMapper.findByLoginId(req.loginId());
        if (user == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return UserDto.Me.from(user);
    }

    public AuthDto.FoundId findLoginId(AuthDto.FindId req) {
        emailVerificationService.verify(req.email(), EmailPurpose.FIND_ID, req.code());
        String email = EmailVerificationService.normalize(req.email());
        List<User> users = userMapper.findByEmail(email);
        if (users.isEmpty()) {
            throw ApiException.notFound("가입되지 않은 이메일입니다.");
        }
        emailVerificationService.consume(email, EmailPurpose.FIND_ID);
        return new AuthDto.FoundId(users.get(0).getLoginId());
    }

    @Transactional
    public void resetPassword(AuthDto.ResetPassword req) {
        String email = EmailVerificationService.normalize(req.email());
        emailVerificationService.requireVerified(email, EmailPurpose.RESET_PASSWORD);
        User user = emailVerificationService.findUserByLoginId(userMapper.findByEmail(email), req.loginId());
        userMapper.savePassword(user.getUserId(), passwordEncoder.encode(req.newPassword()));
        emailVerificationService.consume(email, EmailPurpose.RESET_PASSWORD);
    }

    private static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
