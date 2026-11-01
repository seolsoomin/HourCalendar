package com.hour.room;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hour.schedule.ScheduleStatus;
import com.hour.user.User;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public final class RoomDto {

    private RoomDto() {}

    public record Create(@NotBlank(message = "방 이름을 입력해 주세요.") @Size(max = 100) String title) {}

    public record Join(@NotBlank(message = "방 코드를 입력해 주세요.") String roomCode) {}

    public record Summary(Long roomId, String roomCode, String title, Long hostId, int unreadCount) {
        public static Summary from(Room r) {
            int unread = r.getUnreadCount() == null ? 0 : r.getUnreadCount();
            return new Summary(r.getRoomId(), r.getRoomCode(), r.getRoomTitle(), r.getHostId(), unread);
        }
    }

    public record Member(Long userId, String loginId, String nickname, String profileImage) {
        public static Member from(User u) {
            return new Member(u.getUserId(), u.getLoginId(), u.getNickname(), u.getProfileImage());
        }
    }

    public record Slot(String start, String end) {}

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("HH:mm");

    public record Day(LocalDate date, List<Slot> slots) {
        static Day from(FreeTimeCalculator.DayFreeTime d) {
            return new Day(d.date(), d.slots().stream()
                    .map(s -> new Slot(s.start().format(HM),
                            s.end().equals(LocalTime.MIDNIGHT) ? "24:00" : s.end().format(HM)))
                    .toList());
        }
    }

    public record RoomSchedule(
            Long id,
            LocalDate date,
            LocalDate endDate,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            String title,
            boolean isSecret,
            ScheduleStatus status,
            boolean mine,
            List<String> members
    ) {}

    public record FreeTime(Long roomId, LocalDate weekStart, int participantCount, List<Day> days) {}
}
