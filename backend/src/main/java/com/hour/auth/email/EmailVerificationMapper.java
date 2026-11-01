package com.hour.auth.email;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface EmailVerificationMapper {

    @Select("SELECT id, email, purpose, code_hash, expires_at, verified_at, attempts, created_at "
            + "FROM email_verification WHERE email = #{email} AND purpose = #{purpose}")
    EmailVerification find(@Param("email") String email, @Param("purpose") EmailPurpose purpose);

    @Insert("INSERT INTO email_verification (email, purpose, code_hash, expires_at, attempts, created_at) "
            + "VALUES (#{email}, #{purpose}, #{codeHash}, #{expiresAt}, 0, #{createdAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    int insert(EmailVerification verification);

    @Update("UPDATE email_verification SET attempts = attempts + 1 WHERE id = #{id}")
    int increaseAttempts(@Param("id") Long id);

    @Update("UPDATE email_verification SET verified_at = #{verifiedAt} WHERE id = #{id}")
    int markVerified(@Param("id") Long id, @Param("verifiedAt") LocalDateTime verifiedAt);

    @Delete("DELETE FROM email_verification WHERE email = #{email} AND purpose = #{purpose}")
    int delete(@Param("email") String email, @Param("purpose") EmailPurpose purpose);
}
