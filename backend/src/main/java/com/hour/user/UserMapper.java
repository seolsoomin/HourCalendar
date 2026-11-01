package com.hour.user;

import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface UserMapper {

    User findById(Long userId);

    User findByLoginId(String loginId);

    int countByLoginId(String loginId);

    int insert(User user);

    @Update("UPDATE users SET nickname = #{nickname}, birth_date = #{birthDate,jdbcType=DATE}, "
            + "point_color = #{pointColor}, font = #{font,jdbcType=VARCHAR} WHERE user_id = #{userId}")
    int saveProfile(@Param("userId") Long userId,
                    @Param("nickname") String nickname,
                    @Param("birthDate") LocalDate birthDate,
                    @Param("pointColor") String pointColor,
                    @Param("font") String font);

    @Update("UPDATE users SET profile_image = #{profileImage,jdbcType=VARCHAR} WHERE user_id = #{userId}")
    int saveProfileImage(@Param("userId") Long userId, @Param("profileImage") String profileImage);

    @Select("SELECT user_id, login_id, email, nickname FROM users WHERE LOWER(email) = #{email}")
    List<User> findByEmail(@Param("email") String email);

    @Select("SELECT profile_image FROM users WHERE profile_image IS NOT NULL")
    List<String> findAllProfileImages();

    @Update("UPDATE users SET password_hash = #{passwordHash} WHERE user_id = #{userId}")
    int savePassword(@Param("userId") Long userId, @Param("passwordHash") String passwordHash);

    @Delete("DELETE FROM users WHERE user_id = #{userId}")
    int deleteById(@Param("userId") Long userId);
}
