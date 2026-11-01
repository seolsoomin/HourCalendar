package com.hour.todo;

import com.hour.common.ApiException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoMapper todoMapper;

    public List<TodoDto.Response> getDay(Long userId, LocalDate date) {
        return todoMapper.findByDate(userId, date).stream().map(TodoDto.Response::from).toList();
    }

    @Transactional
    public TodoDto.Response create(Long userId, TodoDto.Create req) {
        Todo t = new Todo();
        t.setUserId(userId);
        t.setTodoDate(req.date());
        t.setContent(req.content().trim());
        t.setDone(false);
        t.setSortOrder(todoMapper.maxSortOrder(userId, req.date()) + 1);
        todoMapper.insert(t);
        return TodoDto.Response.from(todoMapper.findById(t.getTodoId()));
    }

    @Transactional
    public TodoDto.Response update(Long userId, Long todoId, TodoDto.Update req) {
        Todo t = getOwned(userId, todoId);
        if (req.content() != null) {
            if (!StringUtils.hasText(req.content())) {
                throw ApiException.badRequest("할 일을 입력해 주세요.");
            }
            t.setContent(req.content().trim());
        }
        if (req.done() != null) {
            t.setDone(req.done());
        }
        todoMapper.update(t);
        return TodoDto.Response.from(todoMapper.findById(todoId));
    }

    @Transactional
    public void delete(Long userId, Long todoId) {
        getOwned(userId, todoId);
        todoMapper.delete(todoId);
    }

    private Todo getOwned(Long userId, Long todoId) {
        Todo t = todoMapper.findById(todoId);
        if (t == null) {
            throw ApiException.notFound("할 일을 찾을 수 없습니다.");
        }
        if (!t.getUserId().equals(userId)) {
            throw ApiException.forbidden("본인의 할 일만 바꿀 수 있습니다.");
        }
        return t;
    }
}
