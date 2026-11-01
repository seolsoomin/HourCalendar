package com.hour.room;

import com.hour.user.User;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RoomMapper {

    int insert(Room room);

    Room findById(Long roomId);

    Room findByCode(String roomCode);

    int markDeleted(Long roomId);

    int deleteParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);

    int deleteAllParticipants(Long roomId);

    int insertParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);

    int countParticipant(@Param("roomId") Long roomId, @Param("userId") Long userId);

    int countParticipantsAmong(@Param("roomId") Long roomId, @Param("userIds") Collection<Long> userIds);

    List<Room> findMyRooms(Long userId);

    List<User> findParticipants(Long roomId);

    List<Long> findParticipantIds(Long roomId);

    List<RoomScheduleRow> findParticipantSchedules(@Param("roomId") Long roomId,
                                                   @Param("from") LocalDateTime from,
                                                   @Param("to") LocalDateTime to);
}
