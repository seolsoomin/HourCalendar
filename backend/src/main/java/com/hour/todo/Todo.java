package com.hour.todo;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Todo {

    private Long todoId;
    private Long userId;
    private LocalDate todoDate;
    private String content;
    private Boolean done;
    private Integer sortOrder;
    private LocalDateTime createdAt;
}
