package com.hour.schedule;

import com.hour.auth.LoginUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;
    private final GroupScheduleService groupScheduleService;

    @GetMapping
    public List<ScheduleDto.Response> month(@AuthenticationPrincipal LoginUser user,
                                            @RequestParam int year,
                                            @RequestParam int month) {
        return scheduleService.getMonth(user.userId(), year, month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ScheduleDto.Response create(@AuthenticationPrincipal LoginUser user,
                                       @Valid @RequestBody ScheduleDto.Request req) {
        return scheduleService.create(user.userId(), req);
    }

    @PutMapping("/{scheduleId}")
    public ScheduleDto.Response update(@AuthenticationPrincipal LoginUser user,
                                       @PathVariable Long scheduleId,
                                       @Valid @RequestBody ScheduleDto.Request req) {
        return scheduleService.update(user.userId(), scheduleId, req);
    }

    @PatchMapping("/{scheduleId}/date")
    public ScheduleDto.Response move(@AuthenticationPrincipal LoginUser user,
                                     @PathVariable Long scheduleId,
                                     @Valid @RequestBody ScheduleDto.Move req) {
        return scheduleService.move(user.userId(), scheduleId, req.date(), Boolean.TRUE.equals(req.allowOverlap()));
    }

    @DeleteMapping("/{scheduleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser user, @PathVariable Long scheduleId) {
        scheduleService.delete(user.userId(), scheduleId);
    }

    @GetMapping("/invitations")
    public List<ScheduleDto.InvitationResponse> invitations(@AuthenticationPrincipal LoginUser user) {
        return groupScheduleService.getInvitations(user.userId());
    }

    @PostMapping("/{scheduleId}/accept")
    public ScheduleDto.Response accept(@AuthenticationPrincipal LoginUser user, @PathVariable Long scheduleId,
                                       @RequestParam(defaultValue = "false") boolean allowOverlap) {
        return groupScheduleService.accept(user.userId(), scheduleId, allowOverlap);
    }

    @PostMapping("/{scheduleId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@AuthenticationPrincipal LoginUser user, @PathVariable Long scheduleId) {
        groupScheduleService.reject(user.userId(), scheduleId);
    }
}
