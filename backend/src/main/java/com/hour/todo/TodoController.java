package com.hour.todo;

import com.hour.auth.LoginUser;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    @GetMapping
    public List<TodoDto.Response> day(@AuthenticationPrincipal LoginUser user,
                                      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return todoService.getDay(user.userId(), date);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TodoDto.Response create(@AuthenticationPrincipal LoginUser user, @Valid @RequestBody TodoDto.Create req) {
        return todoService.create(user.userId(), req);
    }

    @PatchMapping("/{todoId}")
    public TodoDto.Response update(@AuthenticationPrincipal LoginUser user,
                                   @PathVariable Long todoId,
                                   @Valid @RequestBody TodoDto.Update req) {
        return todoService.update(user.userId(), todoId, req);
    }

    @DeleteMapping("/{todoId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal LoginUser user, @PathVariable Long todoId) {
        todoService.delete(user.userId(), todoId);
    }
}
