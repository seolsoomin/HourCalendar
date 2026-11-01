package com.hour.schedule;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public final class ScheduleDto {

    private ScheduleDto() {}

    public record Request(
            @NotBlank(message = "일정 이름을 입력해 주세요.") @Size(max = 100) String title,
            @NotNull(message = "시작 날짜가 필요합니다.") LocalDate date,
            LocalDate endDate,
            @NotNull(message = "시작 시간을 입력해 주세요.") @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @NotNull(message = "종료 시간을 입력해 주세요.") @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            @Size(max = 1000) String memo,
            Boolean isSecret,
            Boolean showInCompare,
            Boolean allowOverlap
    ) {
        public LocalDateTime start() {
            return date.atTime(startTime);
        }

        public LocalDateTime end() {
            return (endDate != null ? endDate : date).atTime(endTime);
        }
    }

    public record GroupRequest(
            @NotBlank(message = "일정 이름을 입력해 주세요.") @Size(max = 100) String title,
            @NotNull(message = "시작 날짜가 필요합니다.") LocalDate date,
            LocalDate endDate,
            @NotNull(message = "시작 시간을 입력해 주세요.") @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @NotNull(message = "종료 시간을 입력해 주세요.") @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            @Size(max = 1000) String memo,
            @NotEmpty(message = "함께할 사람을 1명 이상 선택해 주세요.") List<Long> memberIds,
            Boolean allowOverlap
    ) {
        public LocalDateTime start() {
            return date.atTime(startTime);
        }

        public LocalDateTime end() {
            return (endDate != null ? endDate : date).atTime(endTime);
        }
    }

    public record Move(@NotNull(message = "날짜가 필요합니다.") LocalDate date, Boolean allowOverlap) {}

    public record Response(
            Long id,
            Long ownerId,
            Long roomId,
            String title,
            LocalDate date,
            LocalDate endDate,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            String memo,
            boolean isSecret,
            boolean showInCompare,
            ScheduleStatus status,
            List<Participant> participants
    ) {
        public static Response from(Schedule s) {
            return new Response(s.getScheduleId(), s.getUserId(), s.getRoomId(), s.getTitle(),
                    s.getStartTime().toLocalDate(), s.getEndTime().toLocalDate(),
                    s.getStartTime().toLocalTime(), s.getEndTime().toLocalTime(),
                    s.getMemo(), Boolean.TRUE.equals(s.getIsSecret()), !Boolean.FALSE.equals(s.getShowInCompare()),
                    s.getStatus(), null);
        }

        public Response withParticipants(List<Participant> list) {
            return new Response(id, ownerId, roomId, title, date, endDate, startTime, endTime,
                    memo, isSecret, showInCompare, status, list);
        }

        public static Response forFriend(Schedule s) {
            Response r = from(s);
            if (!r.isSecret()) {
                return r;
            }
            return new Response(r.id(), r.ownerId(), r.roomId(), "비공개 일정", r.date(), r.endDate(),
                    r.startTime(), r.endTime(), null, true, r.showInCompare(), r.status(), null);
        }
    }

    public record Participant(Long userId, String nickname, String status) {
        public static Participant from(ScheduleParticipant p) {
            return new Participant(p.getUserId(), p.getNickname(), p.getStatus());
        }
    }

    public record InvitationResponse(
            Long scheduleId,
            String title,
            LocalDate date,
            LocalDate endDate,
            @JsonFormat(pattern = "HH:mm") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm") LocalTime endTime,
            String memo,
            Long roomId,
            String roomTitle,
            Long ownerId,
            String ownerNickname
    ) {
        public static InvitationResponse from(Invitation i) {
            return new InvitationResponse(i.getScheduleId(), i.getTitle(),
                    i.getStartTime().toLocalDate(), i.getEndTime().toLocalDate(),
                    i.getStartTime().toLocalTime(), i.getEndTime().toLocalTime(),
                    i.getMemo(), i.getRoomId(), i.getRoomTitle(), i.getOwnerId(), i.getOwnerNickname());
        }
    }
}
