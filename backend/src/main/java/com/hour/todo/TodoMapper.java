package com.hour.todo;

import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface TodoMapper {

    @Select("SELECT todo_id, user_id, todo_date, content, done, sort_order, created_at "
            + "FROM todo WHERE user_id = #{userId} AND todo_date = #{date} ORDER BY sort_order, todo_id")
    List<Todo> findByDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Select("SELECT todo_id, user_id, todo_date, content, done, sort_order, created_at "
            + "FROM todo WHERE todo_id = #{todoId}")
    Todo findById(Long todoId);

    @Select("SELECT COALESCE(MAX(sort_order), 0) FROM todo WHERE user_id = #{userId} AND todo_date = #{date}")
    int maxSortOrder(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Insert("INSERT INTO todo (user_id, todo_date, content, done, sort_order) "
            + "VALUES (#{userId}, #{todoDate}, #{content}, #{done}, #{sortOrder})")
    @Options(useGeneratedKeys = true, keyProperty = "todoId", keyColumn = "todo_id")
    int insert(Todo todo);

    @Update("UPDATE todo SET content = #{content}, done = #{done} WHERE todo_id = #{todoId}")
    int update(Todo todo);

    @Delete("DELETE FROM todo WHERE todo_id = #{todoId}")
    int delete(Long todoId);
}
