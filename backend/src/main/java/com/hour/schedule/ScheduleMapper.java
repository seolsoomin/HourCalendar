package com.hour.schedule;

import com.hour.user.User;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ScheduleMapper {

    Schedule findById(Long scheduleId);

    List<Schedule> findForUserInRange(@Param("userId") Long userId,
                                      @Param("from") LocalDateTime from,
                                      @Param("to") LocalDateTime to);

    List<Schedule> findOverlaps(@Param("userId") Long userId,
                                @Param("start") LocalDateTime start,
                                @Param("end") LocalDateTime end,
                                @Param("excludeId") Long excludeId);

    List<BusySlot> findBusyForUsers(@Param("userIds") List<Long> userIds,
                                    @Param("from") LocalDateTime from,
                                    @Param("to") LocalDateTime to);

    List<User> findUsersWithOverlap(@Param("userIds") List<Long> userIds,
                                    @Param("start") LocalDateTime start,
                                    @Param("end") LocalDateTime end);

    int insert(Schedule schedule);

    int update(Schedule schedule);

    int updateTime(@Param("scheduleId") Long scheduleId,
                   @Param("start") LocalDateTime start,
                   @Param("end") LocalDateTime end);

    int delete(Long scheduleId);

    int updateStatus(@Param("scheduleId") Long scheduleId, @Param("status") ScheduleStatus status);

    int confirmIfAllAccepted(Long scheduleId);

    int insertMember(@Param("scheduleId") Long scheduleId, @Param("userId") Long userId);

    int respond(@Param("scheduleId") Long scheduleId,
                @Param("userId") Long userId,
                @Param("status") MemberStatus status);

    List<Long> findMemberUserIds(Long scheduleId);

    List<Invitation> findPendingInvitations(Long userId);

    List<Schedule> findPendingInRoom(Long roomId);

    List<Long> findMyPendingInvitesInRoom(@Param("roomId") Long roomId, @Param("userId") Long userId);

    @Select({"<script>",
            "SELECT schedule_id, user_id, nickname, status FROM (",
            "  SELECT s.schedule_id, u.user_id, u.nickname, 'HOST' AS status, 0 AS sort_order",
            "  FROM schedule s JOIN users u ON u.user_id = s.user_id",
            "  WHERE s.schedule_id IN",
            "  <foreach collection='ids' item='id' open='(' separator=',' close=')'>#{id}</foreach>",
            "  UNION ALL",
            "  SELECT m.schedule_id, u.user_id, u.nickname, m.status, 1 AS sort_order",
            "  FROM schedule_member m JOIN users u ON u.user_id = m.user_id",
            "  WHERE m.schedule_id IN",
            "  <foreach collection='ids' item='id' open='(' separator=',' close=')'>#{id}</foreach>",
            ") p",
            "ORDER BY schedule_id, sort_order, nickname",
            "</script>"})
    List<ScheduleParticipant> findParticipants(@Param("ids") List<Long> scheduleIds);
}
