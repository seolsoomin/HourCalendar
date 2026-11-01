package com.hour.user;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ProfileImageCleanupJob {

    private final UserMapper userMapper;
    private final Path profileDir;
    private final Duration keep;

    public ProfileImageCleanupJob(UserMapper userMapper,
                                  @Value("${hour.upload-dir:uploads}") String uploadDir,
                                  @Value("${hour.upload-cleanup.keep-days:7}") long keepDays) {
        if (keepDays < 1) {
            throw new IllegalArgumentException("hour.upload-cleanup.keep-days는 1 이상이어야 합니다.");
        }
        this.userMapper = userMapper;
        this.profileDir = Path.of(uploadDir, "profile").toAbsolutePath().normalize();
        this.keep = Duration.ofDays(keepDays);
    }

    @Scheduled(cron = "${hour.upload-cleanup.cron:0 30 4 * * *}", zone = "Asia/Seoul")
    public void deleteUnusedImages() {
        int deleted = cleanup(Instant.now());
        if (deleted > 0) {
            log.info("사용하지 않는 프로필 사진 {}개 삭제", deleted);
        }
    }

    int cleanup(Instant now) {
        if (!Files.isDirectory(profileDir)) {
            return 0;
        }

        Set<String> inUse = inUseFileNames();
        Instant cutoff = now.minus(keep);
        List<Path> candidates;
        try (Stream<Path> files = Files.list(profileDir)) {
            candidates = files.filter(Files::isRegularFile)
                    .filter(file -> !inUse.contains(file.getFileName().toString()))
                    .toList();
        } catch (IOException e) {
            log.error("프로필 사진 폴더를 읽지 못했습니다: {}", profileDir, e);
            return 0;
        }

        int deleted = 0;
        for (Path file : candidates) {
            try {
                if (Files.getLastModifiedTime(file).toInstant().isAfter(cutoff)) {
                    continue;
                }
                if (Files.deleteIfExists(file)) {
                    deleted++;
                }
            } catch (IOException e) {
                log.warn("프로필 사진 삭제 실패: {}", file, e);
            }
        }
        return deleted;
    }

    private Set<String> inUseFileNames() {
        String prefix = ProfileImageService.URL_PREFIX;
        return userMapper.findAllProfileImages().stream()
                .filter(url -> url.startsWith(prefix))
                .map(url -> url.substring(prefix.length()))
                .collect(Collectors.toSet());
    }
}
