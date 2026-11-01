package com.hour.friend;

import com.hour.auth.LoginUser;
import com.hour.schedule.ScheduleDto;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @GetMapping
    public List<FriendDto.Friend> friends(@AuthenticationPrincipal LoginUser user) {
        return friendService.getFriends(user.userId());
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    public void request(@AuthenticationPrincipal LoginUser user, @Valid @RequestBody FriendDto.Create req) {
        friendService.request(user.userId(), req.loginId());
    }

    @GetMapping("/requests")
    public List<FriendDto.Received> received(@AuthenticationPrincipal LoginUser user) {
        return friendService.getReceived(user.userId());
    }

    @PostMapping("/requests/{friendshipId}/accept")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal LoginUser user, @PathVariable Long friendshipId) {
        friendService.accept(user.userId(), friendshipId);
    }

    @PostMapping("/requests/{friendshipId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@AuthenticationPrincipal LoginUser user, @PathVariable Long friendshipId) {
        friendService.reject(user.userId(), friendshipId);
    }

    @DeleteMapping("/{friendUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser user, @PathVariable Long friendUserId) {
        friendService.delete(user.userId(), friendUserId);
    }

    @GetMapping("/{friendUserId}/schedules")
    public List<ScheduleDto.Response> friendSchedules(@AuthenticationPrincipal LoginUser user,
                                                      @PathVariable Long friendUserId,
                                                      @RequestParam int year,
                                                      @RequestParam int month) {
        return friendService.getFriendSchedules(user.userId(), friendUserId, year, month);
    }
}
