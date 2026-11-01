package com.hour.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class ProfileImageCleanupJobTest {

    private static final Instant NOW = Instant.parse("2026-10-22T00:00:00Z");

    @TempDir
    Path uploadDir;

    private Path photo(String name, Duration age) throws IOException {
        Path dir = Files.createDirectories(uploadDir.resolve("profile"));
        Path file = Files.writeString(dir.resolve(name), "x");
        Files.setLastModifiedTime(file, FileTime.from(NOW.minus(age)));
        return file;
    }

    @Test
    void deletesOnlyOldPhotosThatNoUserUses() throws IOException {
        Path inUse = photo("1_used.jpg", Duration.ofDays(30));
        Path oldUnused = photo("1_old.jpg", Duration.ofDays(8));
        Path recentUnused = photo("1_recent.jpg", Duration.ofDays(1));

        UserMapper userMapper = mock(UserMapper.class);
        when(userMapper.findAllProfileImages()).thenReturn(List.of(ProfileImageService.URL_PREFIX + "1_used.jpg"));
        ProfileImageCleanupJob job = new ProfileImageCleanupJob(userMapper, uploadDir.toString(), 7);

        int deleted = job.cleanup(NOW);

        assertThat(deleted).isEqualTo(1);
        assertThat(inUse).exists();
        assertThat(oldUnused).doesNotExist();
        assertThat(recentUnused).exists();
    }

    @Test
    void doesNothingWhenFolderIsMissing() {
        UserMapper userMapper = mock(UserMapper.class);
        ProfileImageCleanupJob job = new ProfileImageCleanupJob(userMapper, uploadDir.resolve("none").toString(), 7);

        assertThat(job.cleanup(NOW)).isZero();
    }
}
