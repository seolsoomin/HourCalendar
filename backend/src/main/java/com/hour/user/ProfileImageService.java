package com.hour.user;

import com.hour.common.ApiException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class ProfileImageService {

    public static final String URL_PREFIX = "/api/uploads/profile/";
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp");

    private final UserMapper userMapper;
    private final UserService userService;
    private final Path profileDir;

    public ProfileImageService(UserMapper userMapper,
                               UserService userService,
                               @Value("${hour.upload-dir:uploads}") String uploadDir) {
        this.userMapper = userMapper;
        this.userService = userService;
        this.profileDir = Path.of(uploadDir, "profile").toAbsolutePath().normalize();
    }

    @Transactional
    public UserDto.Me upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("사진 파일이 비어 있습니다.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw ApiException.badRequest("사진은 5MB 이하만 올릴 수 있습니다.");
        }
        String ext = EXTENSIONS.get(file.getContentType());
        if (ext == null) {
            throw ApiException.badRequest("JPG, PNG, WEBP 사진만 올릴 수 있습니다.");
        }

        String fileName = userId + "_" + UUID.randomUUID() + ext;
        try {
            Files.createDirectories(profileDir);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, profileDir.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            log.error("프로필 사진 저장 실패", e);
            throw new IllegalStateException("사진을 저장하지 못했습니다.", e);
        }

        String oldUrl = userService.getUser(userId).getProfileImage();
        userMapper.saveProfileImage(userId, URL_PREFIX + fileName);
        deleteOldFile(oldUrl);
        return userService.getMe(userId);
    }

    @Transactional
    public UserDto.Me remove(Long userId) {
        String oldUrl = userService.getUser(userId).getProfileImage();
        userMapper.saveProfileImage(userId, null);
        deleteOldFile(oldUrl);
        return userService.getMe(userId);
    }

    void deleteOldFile(String url) {
        if (url == null || !url.startsWith(URL_PREFIX)) return;
        Path target = profileDir.resolve(url.substring(URL_PREFIX.length())).normalize();
        if (!target.startsWith(profileDir)) return;
        try {
            Files.deleteIfExists(target);
        } catch (IOException e) {
            log.warn("예전 프로필 사진 삭제 실패: {}", target, e);
        }
    }
}
