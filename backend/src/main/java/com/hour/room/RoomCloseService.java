package com.hour.room;

import com.hour.chat.ChatPoster;
import com.hour.common.ApiException;
import com.hour.notification.NotificationService;
import com.hour.notification.NotificationType;
import com.hour.schedule.GroupScheduleService;
import com.hour.schedule.Schedule;
import com.hour.schedule.ScheduleMapper;
import com.hour.schedule.ScheduleStatus;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomCloseService {

    private final RoomService roomService;
    private final RoomMapper roomMapper;
    private final ScheduleMapper scheduleMapper;
    private final GroupScheduleService groupScheduleService;
    private final NotificationService notificationService;
    private final ChatPoster chatPoster;

    @Transactional
    public void delete(Long userId, Long roomId) {
        Room room = roomService.getActiveRoom(roomId);
        if (!room.getHostId().equals(userId)) {
            throw ApiException.forbidden("방장만 방을 삭제할 수 있습니다.");
        }

        for (Schedule s : scheduleMapper.findPendingInRoom(roomId)) {
            scheduleMapper.updateStatus(s.getScheduleId(), ScheduleStatus.CANCELED);
            String message = "'" + room.getRoomTitle() + "' 방이 삭제되어 '" + s.getTitle() + "' 일정 초대가 취소되었습니다.";
            Set<Long> targets = new LinkedHashSet<>(scheduleMapper.findMemberUserIds(s.getScheduleId()));
            targets.add(s.getUserId());
            targets.remove(userId);
            for (Long target : targets) {
                notificationService.send(target, NotificationType.SCHEDULE_CANCELED, s.getScheduleId(), message);
            }
        }

        roomMapper.deleteAllParticipants(roomId);
        roomMapper.markDeleted(roomId);
    }

    @Transactional
    public void leave(Long userId, Long roomId) {
        Room room = roomService.getActiveRoom(roomId);
        if (room.getHostId().equals(userId)) {
            throw ApiException.badRequest("방장은 방을 나갈 수 없습니다. 방을 삭제해 주세요.");
        }
        roomService.assertParticipant(roomId, userId);

        for (Long scheduleId : scheduleMapper.findMyPendingInvitesInRoom(roomId, userId)) {
            groupScheduleService.reject(userId, scheduleId);
        }

        chatPoster.memberLeft(roomId, userId);
        roomMapper.deleteParticipant(roomId, userId);
    }
}
