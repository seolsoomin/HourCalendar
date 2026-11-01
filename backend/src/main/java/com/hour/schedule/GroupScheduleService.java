package com.hour.schedule;

import com.hour.chat.ChatPoster;
import com.hour.common.ApiException;
import com.hour.notification.NotificationService;
import com.hour.notification.NotificationType;
import com.hour.room.RoomService;
import com.hour.user.User;
import com.hour.user.UserService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GroupScheduleService {

    private final ScheduleMapper scheduleMapper;
    private final RoomService roomService;
    private final UserService userService;
    private final NotificationService notificationService;
    private final ChatPoster chatPoster;

    @Transactional
    public ScheduleDto.Response create(Long userId, Long roomId, ScheduleDto.GroupRequest req) {
        roomService.assertParticipant(roomId, userId);

        LocalDateTime start = req.start();
        LocalDateTime end = req.end();
        ScheduleService.validateTime(start, end);

        Set<Long> memberIds = new LinkedHashSet<>(req.memberIds());
        memberIds.remove(userId);
        if (memberIds.isEmpty()) {
            throw ApiException.badRequest("함께할 사람을 1명 이상 선택해 주세요.");
        }
        if (!roomService.areAllParticipants(roomId, memberIds)) {
            throw ApiException.badRequest("이 방에 들어와 있는 사람만 선택할 수 있습니다.");
        }

        List<Long> everyone = new ArrayList<>(memberIds);
        everyone.add(userId);
        if (!Boolean.TRUE.equals(req.allowOverlap())) {
            List<User> busy = scheduleMapper.findUsersWithOverlap(everyone, start, end);
            if (!busy.isEmpty()) {
                String names = busy.stream().map(User::getNickname).collect(Collectors.joining(", "));
                throw ApiException.conflict("다음 사람의 일정과 시간이 겹칩니다: " + names, ScheduleService.OVERLAP_CODE);
            }
        }

        Schedule s = new Schedule();
        s.setUserId(userId);
        s.setRoomId(roomId);
        s.setTitle(req.title().trim());
        s.setStartTime(start);
        s.setEndTime(end);
        s.setMemo(ScheduleService.blankToNull(req.memo()));
        s.setIsSecret(false);
        s.setShowInCompare(true);
        s.setStatus(ScheduleStatus.PENDING);
        scheduleMapper.insert(s);

        String ownerName = userService.getUser(userId).getNickname();
        String message = ownerName + "님이 '" + s.getTitle() + "' 일정에 초대했습니다.";
        for (Long memberId : memberIds) {
            scheduleMapper.insertMember(s.getScheduleId(), memberId);
            notificationService.send(memberId, NotificationType.SCHEDULE_INVITE, s.getScheduleId(), message);
        }
        chatPoster.invite(roomId, userId, s.getScheduleId(), s.getTitle(), start, end);

        return ScheduleDto.Response.from(scheduleMapper.findById(s.getScheduleId()));
    }

    public List<ScheduleDto.InvitationResponse> getInvitations(Long userId) {
        return scheduleMapper.findPendingInvitations(userId).stream()
                .map(ScheduleDto.InvitationResponse::from)
                .toList();
    }

    @Transactional
    public ScheduleDto.Response accept(Long userId, Long scheduleId, boolean allowOverlap) {
        Schedule s = getPendingGroupSchedule(scheduleId);

        if (!allowOverlap) {
            List<Schedule> overlaps = scheduleMapper.findOverlaps(userId, s.getStartTime(), s.getEndTime(), scheduleId);
            if (!overlaps.isEmpty()) {
                throw ApiException.conflict("내 일정과 시간이 겹칩니다: " + ScheduleService.describe(overlaps),
                        ScheduleService.OVERLAP_CODE);
            }
        }
        if (scheduleMapper.respond(scheduleId, userId, MemberStatus.ACCEPTED) == 0) {
            throw ApiException.notFound("응답할 수 있는 초대가 없습니다.");
        }
        if (scheduleMapper.confirmIfAllAccepted(scheduleId) > 0) {
            chatPoster.system(s.getRoomId(), "'" + s.getTitle() + "' 일정이 확정됐어요. "
                    + ChatPoster.describe(s.getStartTime(), s.getEndTime()));
        }

        return ScheduleDto.Response.from(scheduleMapper.findById(scheduleId));
    }

    @Transactional
    public void reject(Long userId, Long scheduleId) {
        Schedule s = getPendingGroupSchedule(scheduleId);
        if (scheduleMapper.respond(scheduleId, userId, MemberStatus.REJECTED) == 0) {
            throw ApiException.notFound("응답할 수 있는 초대가 없습니다.");
        }
        scheduleMapper.updateStatus(scheduleId, ScheduleStatus.CANCELED);

        String rejecter = userService.getUser(userId).getNickname();
        String message = rejecter + "님이 거절하여 '" + s.getTitle() + "' 일정이 취소되었습니다.";
        chatPoster.system(s.getRoomId(), rejecter + "님이 거절해서 '" + s.getTitle() + "' 일정이 취소됐어요.");

        Set<Long> targets = new LinkedHashSet<>(scheduleMapper.findMemberUserIds(scheduleId));
        targets.add(s.getUserId());
        targets.remove(userId);
        for (Long target : targets) {
            notificationService.send(target, NotificationType.SCHEDULE_CANCELED, scheduleId, message);
        }
    }

    private Schedule getPendingGroupSchedule(Long scheduleId) {
        Schedule s = scheduleMapper.findById(scheduleId);
        if (s == null || s.getRoomId() == null) {
            throw ApiException.notFound("다인 일정을 찾을 수 없습니다.");
        }
        if (s.getStatus() != ScheduleStatus.PENDING) {
            throw ApiException.conflict("이미 확정되었거나 취소된 일정입니다.");
        }
        return s;
    }
}
