package com.hour.chat;

import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ChatMapper {

    int insert(RoomMessage message);

    RoomMessage findById(Long messageId);

    List<RoomMessage> findLatest(@Param("roomId") Long roomId, @Param("limit") int limit);

    List<RoomMessage> findBefore(@Param("roomId") Long roomId,
                                 @Param("beforeId") Long beforeId,
                                 @Param("limit") int limit);

    List<RoomMessage> findAfter(@Param("roomId") Long roomId,
                                @Param("afterId") Long afterId,
                                @Param("limit") int limit);

    int markRead(@Param("roomId") Long roomId,
                 @Param("userId") Long userId,
                 @Param("messageId") Long messageId);

    int markReadToLatest(@Param("roomId") Long roomId, @Param("userId") Long userId);
}
