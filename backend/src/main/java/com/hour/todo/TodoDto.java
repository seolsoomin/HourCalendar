package com.hour.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class TodoDto {

    private TodoDto() {}

    public record Create(
            @NotNull(message = "날짜가 필요합니다.") LocalDate date,
            @NotBlank(message = "할 일을 입력해 주세요.") @Size(max = 200, message = "할 일은 200자까지 쓸 수 있습니다.") String content
    ) {}

    public record Update(
            @Size(max = 200, message = "할 일은 200자까지 쓸 수 있습니다.") String content,
            Boolean done
    ) {}

    public record Response(Long id, LocalDate date, String content, boolean done) {
        public static Response from(Todo t) {
            return new Response(t.getTodoId(), t.getTodoDate(), t.getContent(), Boolean.TRUE.equals(t.getDone()));
        }
    }
}
