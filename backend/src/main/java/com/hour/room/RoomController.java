package com.hour.room;

import com.hour.auth.LoginUser;
import com.hour.common.ApiException;
import com.hour.schedule.GroupScheduleService;
import com.hour.schedule.ScheduleDto;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final GroupScheduleService groupScheduleService;
    private final RoomCloseService roomCloseService;

    @GetMapping
    public List<RoomDto.Summary> myRooms(@AuthenticationPrincipal LoginUser user) {
        return roomService.getMyRooms(user.userId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomDto.Summary create(@AuthenticationPrincipal LoginUser user, @Valid @RequestBody RoomDto.Create req) {
        return roomService.create(user.userId(), req.title());
    }

    @PostMapping("/join")
    public RoomDto.Summary join(@AuthenticationPrincipal LoginUser user, @Valid @RequestBody RoomDto.Join req) {
        return roomService.join(user.userId(), req.roomCode());
    }

    @DeleteMapping("/{roomId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser user, @PathVariable Long roomId) {
        roomCloseService.delete(user.userId(), roomId);
    }

    @PostMapping("/{roomId}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@AuthenticationPrincipal LoginUser user, @PathVariable Long roomId) {
        roomCloseService.leave(user.userId(), roomId);
    }

    @GetMapping("/{roomId}/members")
    public List<RoomDto.Member> members(@AuthenticationPrincipal LoginUser user, @PathVariable Long roomId) {
        return roomService.getMembers(user.userId(), roomId);
    }

    @GetMapping("/{roomId}/free-time")
    public RoomDto.FreeTime freeTime(
            @AuthenticationPrincipal LoginUser user,
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart,
            @RequestParam(defaultValue = "00:00") String dayStart,
            @RequestParam(defaultValue = "24:00") String dayEnd,
            @RequestParam(defaultValue = "30") int minMinutes) {
        return roomService.getFreeTime(user.userId(), roomId, weekStart,
                toMinutes(dayStart), toMinutes(dayEnd), minMinutes);
    }

    private static int toMinutes(String hhmm) {
        if (hhmm == null || !hhmm.matches("\\d{2}:\\d{2}")) {
            throw ApiException.badRequest("시간은 HH:mm 형식이어야 합니다.");
        }
        int h = Integer.parseInt(hhmm.substring(0, 2));
        int m = Integer.parseInt(hhmm.substring(3, 5));
        if (h > 24 || m > 59 || (h == 24 && m > 0)) {
            throw ApiException.badRequest("시간은 00:00 ~ 24:00 사이여야 합니다.");
        }
        return h * 60 + m;
    }

    @GetMapping("/{roomId}/schedules")
    public List<RoomDto.RoomSchedule> weekSchedules(
            @AuthenticationPrincipal LoginUser user,
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return roomService.getWeekSchedules(user.userId(), roomId, weekStart);
    }

    @PostMapping("/{roomId}/schedules")
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleDto.Response createGroupSchedule(@AuthenticationPrincipal LoginUser user,
                                                    @PathVariable Long roomId,
                                                    @Valid @RequestBody ScheduleDto.GroupRequest req) {
        return groupScheduleService.create(user.userId(), roomId, req);
    }
}
