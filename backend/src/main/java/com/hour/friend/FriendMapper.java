package com.hour.friend;

import com.hour.user.User;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FriendMapper {

    Friendship findBetween(@Param("a") Long a, @Param("b") Long b);

    int insert(Friendship friendship);

    int reRequest(@Param("friendshipId") Long friendshipId,
                  @Param("userId") Long userId,
                  @Param("friendId") Long friendId);

    List<ReceivedRequest> findReceived(Long userId);

    int respond(@Param("friendshipId") Long friendshipId,
                @Param("receiverId") Long receiverId,
                @Param("status") FriendStatus status);

    List<User> findFriends(Long userId);

    int countAccepted(@Param("a") Long a, @Param("b") Long b);

    int markDeleted(@Param("a") Long a, @Param("b") Long b);

    int deleteStale(LocalDateTime before);
}
