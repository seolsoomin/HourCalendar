package com.hour.friend;

import com.hour.common.ApiException;
import com.hour.notification.NotificationService;
import com.hour.notification.NotificationType;
import com.hour.schedule.ScheduleDto;
import com.hour.schedule.ScheduleMapper;
import com.hour.user.User;
import com.hour.user.UserMapper;
import com.hour.user.UserService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final FriendMapper friendMapper;
    private final UserMapper userMapper;
    private final UserService userService;
    private final ScheduleMapper scheduleMapper;
    private final NotificationService notificationService;

    @Transactional
    public void request(Long userId, String targetLoginId) {
        User target = userMapper.findByLoginId(targetLoginId.trim());
        if (target == null) {
            throw ApiException.notFound("존재하지 않는 아이디입니다.");
        }
        if (target.getUserId().equals(userId)) {
            throw ApiException.badRequest("자기 자신에게는 친구 요청을 보낼 수 없습니다.");
        }

        Friendship existing = friendMapper.findBetween(userId, target.getUserId());
        Long friendshipId;
        if (existing == null) {
            Friendship f = new Friendship();
            f.setUserId(userId);
            f.setFriendId(target.getUserId());
            f.setStatus(FriendStatus.REQUESTED);
            friendMapper.insert(f);
            friendshipId = f.getFriendshipId();
        } else {
            switch (existing.getStatus()) {
                case ACCEPTED -> throw ApiException.conflict("이미 친구입니다.");
                case REQUESTED -> throw ApiException.conflict(existing.getUserId().equals(userId)
                        ? "이미 친구 요청을 보냈습니다."
                        : "상대방이 이미 친구 요청을 보냈습니다. 받은 요청 메뉴에서 수락해 주세요.");
                default -> {
                    friendMapper.reRequest(existing.getFriendshipId(), userId, target.getUserId());
                    friendshipId = existing.getFriendshipId();
                }
            }
        }

        String myName = userService.getUser(userId).getNickname();
        notificationService.send(target.getUserId(), NotificationType.FRIEND_REQUEST, friendshipId,
                myName + "님이 친구 요청을 보냈습니다.");
    }

    public List<FriendDto.Received> getReceived(Long userId) {
        return friendMapper.findReceived(userId).stream().map(FriendDto.Received::from).toList();
    }

    @Transactional
    public void accept(Long userId, Long friendshipId) {
        if (friendMapper.respond(friendshipId, userId, FriendStatus.ACCEPTED) == 0) {
            throw ApiException.notFound("처리할 친구 요청이 없습니다.");
        }
    }

    @Transactional
    public void reject(Long userId, Long friendshipId) {
        if (friendMapper.respond(friendshipId, userId, FriendStatus.REJECTED) == 0) {
            throw ApiException.notFound("처리할 친구 요청이 없습니다.");
        }
    }

    public List<FriendDto.Friend> getFriends(Long userId) {
        return friendMapper.findFriends(userId).stream().map(FriendDto.Friend::from).toList();
    }

    @Transactional
    public void delete(Long userId, Long friendUserId) {
        if (friendMapper.markDeleted(userId, friendUserId) == 0) {
            throw ApiException.notFound("친구 관계가 아닙니다.");
        }
    }

    public List<ScheduleDto.Response> getFriendSchedules(Long userId, Long friendUserId, int year, int month) {
        if (friendMapper.countAccepted(userId, friendUserId) == 0) {
            throw ApiException.forbidden("친구의 일정만 볼 수 있습니다.");
        }
        if (month < 1 || month > 12) {
            throw ApiException.badRequest("월은 1~12 사이여야 합니다.");
        }
        LocalDateTime from = LocalDate.of(year, month, 1).atStartOfDay();
        return scheduleMapper.findForUserInRange(friendUserId, from, from.plusMonths(1)).stream()
                .map(ScheduleDto.Response::forFriend)
                .toList();
    }
}
