package com.hour.user;

import com.hour.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WithdrawService {

    private final UserMapper userMapper;
    private final UserService userService;
    private final ProfileImageService profileImageService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void withdraw(Long userId, String password) {
        User user = userService.getUser(userId);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.badRequest("비밀번호가 올바르지 않습니다.");
        }

        userMapper.deleteById(userId);

        profileImageService.deleteOldFile(user.getProfileImage());
    }
}
