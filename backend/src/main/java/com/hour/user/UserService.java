package com.hour.user;

import com.hour.common.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;

    public User getUser(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw ApiException.notFound("존재하지 않는 사용자입니다.");
        }
        return user;
    }

    public UserDto.Me getMe(Long userId) {
        return UserDto.Me.from(getUser(userId));
    }

    @Transactional
    public UserDto.Me updateProfile(Long userId, UserDto.ProfileUpdate req) {
        User user = getUser(userId);
        String pointColor = req.pointColor() != null ? req.pointColor().toUpperCase() : user.getPointColor();
        String font = req.font() != null ? req.font() : user.getFont();
        userMapper.saveProfile(userId, req.nickname().trim(), req.birth(), pointColor, font);
        return getMe(userId);
    }
}
