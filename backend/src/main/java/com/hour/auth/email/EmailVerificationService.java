package com.hour.auth.email;

import com.hour.common.ApiException;
import com.hour.user.User;
import com.hour.user.UserMapper;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);
    private static final Duration VERIFIED_TTL = Duration.ofMinutes(30);
    private static final int MAX_ATTEMPTS = 5;

    private final EmailVerificationMapper verificationMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom random = new SecureRandom();

    public static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public void sendCode(String rawEmail, EmailPurpose purpose, String loginId) {
        String email = normalize(rawEmail);
        List<User> users = userMapper.findByEmail(email);
        switch (purpose) {
            case SIGNUP -> {
                if (!users.isEmpty()) throw ApiException.conflict("이미 가입된 이메일입니다.");
            }
            case FIND_ID -> {
                if (users.isEmpty()) throw ApiException.notFound("가입되지 않은 이메일입니다.");
            }
            case RESET_PASSWORD -> findUserByLoginId(users, loginId);
        }

        LocalDateTime now = LocalDateTime.now();
        EmailVerification last = verificationMapper.find(email, purpose);
        if (last != null && last.getCreatedAt() != null) {
            long waitSeconds = Duration.between(now, last.getCreatedAt().plus(RESEND_COOLDOWN)).toSeconds();
            if (waitSeconds > 0) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, waitSeconds + "초 후에 다시 요청할 수 있습니다.");
            }
        }

        String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
        verificationMapper.delete(email, purpose);

        EmailVerification verification = new EmailVerification();
        verification.setEmail(email);
        verification.setPurpose(purpose);
        verification.setCodeHash(passwordEncoder.encode(code));
        verification.setExpiresAt(now.plus(CODE_TTL));
        verification.setCreatedAt(now);
        verificationMapper.insert(verification);

        mailService.sendCode(email, purpose, code);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public void verify(String rawEmail, EmailPurpose purpose, String code) {
        String email = normalize(rawEmail);
        EmailVerification v = verificationMapper.find(email, purpose);
        if (v == null) {
            throw ApiException.badRequest("인증번호를 먼저 요청해 주세요.");
        }
        if (v.getVerifiedAt() != null) {
            return;
        }
        if (LocalDateTime.now().isAfter(v.getExpiresAt())) {
            throw ApiException.badRequest("인증번호가 만료되었습니다. 다시 요청해 주세요.");
        }
        if (v.getAttempts() >= MAX_ATTEMPTS) {
            throw ApiException.badRequest("입력 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.");
        }
        if (code == null || !passwordEncoder.matches(code.trim(), v.getCodeHash())) {
            verificationMapper.increaseAttempts(v.getId());
            int left = MAX_ATTEMPTS - v.getAttempts() - 1;
            throw ApiException.badRequest(left > 0
                    ? "인증번호가 일치하지 않습니다. (남은 횟수 " + left + "회)"
                    : "입력 횟수를 초과했습니다. 인증번호를 다시 요청해 주세요.");
        }
        verificationMapper.markVerified(v.getId(), LocalDateTime.now());
    }

    public void requireVerified(String rawEmail, EmailPurpose purpose) {
        EmailVerification v = verificationMapper.find(normalize(rawEmail), purpose);
        if (v == null || v.getVerifiedAt() == null) {
            throw ApiException.badRequest("이메일 인증을 먼저 완료해 주세요.");
        }
        if (LocalDateTime.now().isAfter(v.getVerifiedAt().plus(VERIFIED_TTL))) {
            throw ApiException.badRequest("이메일 인증 후 30분이 지났습니다. 다시 인증해 주세요.");
        }
    }

    public void consume(String rawEmail, EmailPurpose purpose) {
        verificationMapper.delete(normalize(rawEmail), purpose);
    }

    public User findUserByLoginId(List<User> users, String loginId) {
        String id = loginId == null ? "" : loginId.trim();
        return users.stream()
                .filter(u -> u.getLoginId().equals(id))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound("아이디와 이메일이 일치하는 회원이 없습니다."));
    }
}
