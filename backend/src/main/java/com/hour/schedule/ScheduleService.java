package com.hour.schedule;

import com.hour.chat.ChatPoster;
import com.hour.common.ApiException;
import com.hour.notification.NotificationService;
import com.hour.notification.NotificationType;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ScheduleService {

    private static final DateTimeFormatter HM = DateTimeFormatter.ofPattern("M/d HH:mm");
    private static final int MAX_DAYS = 31;
    private static final int MAX_LISTED = 3;
    public static final String OVERLAP_CODE = "SCHEDULE_OVERLAP";

    private final ScheduleMapper scheduleMapper;
    private final NotificationService notificationService;
    private final ChatPoster chatPoster;

    public List<ScheduleDto.Response> getMonth(Long userId, int year, int month) {
        List<Schedule> schedules = findMonth(userId, year, month);
        if (schedules.isEmpty()) {
            return List.of();
        }

        List<Long> ids = schedules.stream().map(Schedule::getScheduleId).toList();
        Map<Long, List<ScheduleDto.Participant>> participantsById = scheduleMapper.findParticipants(ids).stream()
                .collect(Collectors.groupingBy(ScheduleParticipant::getScheduleId, LinkedHashMap::new,
                        Collectors.mapping(ScheduleDto.Participant::from, Collectors.toList())));

        return schedules.stream().map(s -> {
            List<ScheduleDto.Participant> participants = participantsById.get(s.getScheduleId());
            boolean isGroup = participants != null && participants.size() > 1;
            return ScheduleDto.Response.from(s).withParticipants(isGroup ? participants : null);
        }).toList();
    }

    List<Schedule> findMonth(Long userId, int year, int month) {
        if (month < 1 || month > 12) {
            throw ApiException.badRequest("월은 1~12 사이여야 합니다.");
        }
        LocalDateTime from = LocalDate.of(year, month, 1).atStartOfDay();
        return scheduleMapper.findForUserInRange(userId, from, from.plusMonths(1));
    }

    @Transactional
    public ScheduleDto.Response create(Long userId, ScheduleDto.Request req) {
        LocalDateTime start = req.start();
        LocalDateTime end = req.end();
        validateTime(start, end);
        checkOverlap(userId, start, end, null, Boolean.TRUE.equals(req.allowOverlap()));

        Schedule s = new Schedule();
        s.setUserId(userId);
        s.setTitle(req.title().trim());
        s.setStartTime(start);
        s.setEndTime(end);
        s.setMemo(blankToNull(req.memo()));
        s.setIsSecret(Boolean.TRUE.equals(req.isSecret()));
        s.setShowInCompare(showInCompare(start, end, req));
        s.setStatus(ScheduleStatus.CONFIRMED);
        scheduleMapper.insert(s);

        return ScheduleDto.Response.from(scheduleMapper.findById(s.getScheduleId()));
    }

    @Transactional
    public ScheduleDto.Response update(Long userId, Long scheduleId, ScheduleDto.Request req) {
        Schedule s = getOwned(userId, scheduleId);
        if (s.getRoomId() != null) {
            throw ApiException.badRequest("다인 일정은 수정할 수 없습니다. 삭제 후 다시 추가해 주세요.");
        }
        LocalDateTime start = req.start();
        LocalDateTime end = req.end();
        validateTime(start, end);
        checkOverlap(userId, start, end, scheduleId, Boolean.TRUE.equals(req.allowOverlap()));

        s.setTitle(req.title().trim());
        s.setStartTime(start);
        s.setEndTime(end);
        s.setMemo(blankToNull(req.memo()));
        s.setIsSecret(Boolean.TRUE.equals(req.isSecret()));
        s.setShowInCompare(showInCompare(start, end, req));
        scheduleMapper.update(s);

        return ScheduleDto.Response.from(scheduleMapper.findById(scheduleId));
    }

    @Transactional
    public ScheduleDto.Response move(Long userId, Long scheduleId, LocalDate date, boolean allowOverlap) {
        Schedule s = getOwned(userId, scheduleId);
        if (s.getRoomId() != null) {
            throw ApiException.badRequest("다인 일정은 옮길 수 없습니다.");
        }
        LocalDateTime start = date.atTime(s.getStartTime().toLocalTime());
        LocalDateTime end = start.plus(Duration.between(s.getStartTime(), s.getEndTime()));
        checkOverlap(userId, start, end, scheduleId, allowOverlap);

        scheduleMapper.updateTime(scheduleId, start, end);
        return ScheduleDto.Response.from(scheduleMapper.findById(scheduleId));
    }

    @Transactional
    public void delete(Long userId, Long scheduleId) {
        Schedule s = getOwned(userId, scheduleId);

        if (s.getRoomId() != null && s.getStatus() != ScheduleStatus.CANCELED) {
            String message = "'" + s.getTitle() + "' 다인 일정이 삭제되었습니다.";
            for (Long memberId : scheduleMapper.findMemberUserIds(scheduleId)) {
                notificationService.send(memberId, NotificationType.SCHEDULE_CANCELED, scheduleId, message);
            }
            chatPoster.system(s.getRoomId(), "'" + s.getTitle() + "' 다인 일정이 삭제됐어요.");
        }
        scheduleMapper.delete(scheduleId);
    }

    Schedule getOwned(Long userId, Long scheduleId) {
        Schedule s = scheduleMapper.findById(scheduleId);
        if (s == null) {
            throw ApiException.notFound("일정을 찾을 수 없습니다.");
        }
        if (!s.getUserId().equals(userId)) {
            throw ApiException.forbidden("본인의 일정만 변경할 수 있습니다.");
        }
        return s;
    }

    static void validateTime(LocalDateTime start, LocalDateTime end) {
        if (!end.isAfter(start)) {
            throw ApiException.badRequest("종료 일시는 시작 일시보다 늦어야 합니다.");
        }
        if (Duration.between(start, end).toDays() > MAX_DAYS) {
            throw ApiException.badRequest("일정은 최대 " + MAX_DAYS + "일까지 만들 수 있습니다.");
        }
    }

    private void checkOverlap(Long userId, LocalDateTime start, LocalDateTime end, Long excludeId,
                              boolean allowOverlap) {
        if (allowOverlap) {
            return;
        }
        List<Schedule> overlaps = scheduleMapper.findOverlaps(userId, start, end, excludeId);
        if (!overlaps.isEmpty()) {
            throw ApiException.conflict("이미 등록된 일정과 시간이 겹칩니다: " + describe(overlaps), OVERLAP_CODE);
        }
    }

    static String describe(List<Schedule> overlaps) {
        String shown = overlaps.stream().limit(MAX_LISTED)
                .map(o -> String.format("%s (%s–%s)", o.getTitle(),
                        o.getStartTime().format(HM), o.getEndTime().format(HM)))
                .collect(Collectors.joining(", "));
        int rest = overlaps.size() - MAX_LISTED;
        return rest > 0 ? shown + " 외 " + rest + "건" : shown;
    }

    private static boolean showInCompare(LocalDateTime start, LocalDateTime end, ScheduleDto.Request req) {
        boolean multiDay = end.toLocalDate().isAfter(start.toLocalDate());
        return !multiDay || !Boolean.FALSE.equals(req.showInCompare());
    }

    static String blankToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }
}
