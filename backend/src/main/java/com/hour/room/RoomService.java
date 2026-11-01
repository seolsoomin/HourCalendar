package com.hour.room;

import com.hour.chat.ChatMapper;
import com.hour.chat.ChatPoster;
import com.hour.common.ApiException;
import com.hour.schedule.BusySlot;
import com.hour.schedule.ScheduleMapper;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RoomService {

    private static final String CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 8;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RoomMapper roomMapper;
    private final ScheduleMapper scheduleMapper;
    private final ChatMapper chatMapper;
    private final ChatPoster chatPoster;

    @Transactional
    public RoomDto.Summary create(Long userId, String title) {
        Room room = new Room();
        room.setRoomCode(generateUniqueCode());
        room.setHostId(userId);
        room.setRoomTitle(title.trim());
        roomMapper.insert(room);
        roomMapper.insertParticipant(room.getRoomId(), userId);
        chatPoster.roomCreated(room.getRoomId(), userId);
        chatMapper.markReadToLatest(room.getRoomId(), userId);
        return RoomDto.Summary.from(room);
    }

    @Transactional
    public RoomDto.Summary join(Long userId, String roomCode) {
        Room room = roomMapper.findByCode(roomCode.trim().toUpperCase());
        if (room == null || room.getDeletedAt() != null) {
            throw ApiException.notFound("존재하지 않는 방입니다.");
        }
        if (roomMapper.countParticipant(room.getRoomId(), userId) > 0) {
            throw ApiException.conflict("이미 들어가 있는 방입니다.");
        }
        roomMapper.insertParticipant(room.getRoomId(), userId);
        chatPoster.memberJoined(room.getRoomId(), userId);
        chatMapper.markReadToLatest(room.getRoomId(), userId);
        return RoomDto.Summary.from(room);
    }

    public List<RoomDto.Summary> getMyRooms(Long userId) {
        return roomMapper.findMyRooms(userId).stream().map(RoomDto.Summary::from).toList();
    }

    public List<RoomDto.Member> getMembers(Long userId, Long roomId) {
        assertParticipant(roomId, userId);
        return roomMapper.findParticipants(roomId).stream().map(RoomDto.Member::from).toList();
    }

    public RoomDto.FreeTime getFreeTime(Long userId, Long roomId, LocalDate weekStart,
                                        int dayStartMinute, int dayEndMinute, int minMinutes) {
        assertParticipant(roomId, userId);
        if (dayStartMinute < 0 || dayEndMinute > 24 * 60 || dayEndMinute <= dayStartMinute) {
            throw ApiException.badRequest("하루의 끝 시간은 시작 시간보다 늦어야 합니다.");
        }
        if (minMinutes < 1) {
            throw ApiException.badRequest("최소 시간은 1분 이상이어야 합니다.");
        }

        List<Long> participantIds = roomMapper.findParticipantIds(roomId);
        LocalDateTime from = weekStart.atStartOfDay();
        List<BusySlot> busy = scheduleMapper.findBusyForUsers(participantIds, from, from.plusDays(7));

        List<FreeTimeCalculator.Interval> intervals = busy.stream()
                .map(b -> new FreeTimeCalculator.Interval(b.getStartTime(), b.getEndTime()))
                .toList();
        List<RoomDto.Day> days = FreeTimeCalculator.calculate(intervals, weekStart, 7, dayStartMinute, dayEndMinute, minMinutes)
                .stream()
                .map(RoomDto.Day::from)
                .toList();

        return new RoomDto.FreeTime(roomId, weekStart, participantIds.size(), days);
    }

    public List<RoomDto.RoomSchedule> getWeekSchedules(Long userId, Long roomId, LocalDate weekStart) {
        assertParticipant(roomId, userId);
        LocalDateTime from = weekStart.atStartOfDay();
        List<RoomScheduleRow> rows = roomMapper.findParticipantSchedules(roomId, from, from.plusDays(7));

        Map<Long, List<RoomScheduleRow>> bySchedule = new LinkedHashMap<>();
        for (RoomScheduleRow row : rows) {
            bySchedule.computeIfAbsent(row.getScheduleId(), id -> new ArrayList<>()).add(row);
        }

        List<RoomDto.RoomSchedule> result = new ArrayList<>();
        for (List<RoomScheduleRow> group : bySchedule.values()) {
            RoomScheduleRow first = group.get(0);
            boolean mine = group.stream().anyMatch(r -> r.getParticipantId().equals(userId));
            boolean secret = Boolean.TRUE.equals(first.getIsSecret());
            String title = (secret && !mine) ? "비공개 일정" : first.getTitle();
            List<String> members = group.stream().map(RoomScheduleRow::getNickname).distinct().toList();

            result.add(new RoomDto.RoomSchedule(
                    first.getScheduleId(),
                    first.getStartTime().toLocalDate(),
                    first.getEndTime().toLocalDate(),
                    first.getStartTime().toLocalTime(),
                    first.getEndTime().toLocalTime(),
                    title,
                    secret,
                    first.getStatus(),
                    mine,
                    members));
        }
        return result;
    }

    public Room getActiveRoom(Long roomId) {
        Room room = roomMapper.findById(roomId);
        if (room == null || room.getDeletedAt() != null) {
            throw ApiException.notFound("존재하지 않는 방입니다.");
        }
        return room;
    }

    public void assertParticipant(Long roomId, Long userId) {
        getActiveRoom(roomId);
        if (roomMapper.countParticipant(roomId, userId) == 0) {
            throw ApiException.forbidden("들어가 있는 방만 볼 수 있습니다.");
        }
    }

    public boolean areAllParticipants(Long roomId, Collection<Long> userIds) {
        return roomMapper.countParticipantsAmong(roomId, userIds) == userIds.size();
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CODE_CHARS.charAt(RANDOM.nextInt(CODE_CHARS.length())));
            }
            String code = sb.toString();
            if (roomMapper.findByCode(code) == null) {
                return code;
            }
        }
        throw new IllegalStateException("방 코드 생성에 실패했습니다.");
    }
}
