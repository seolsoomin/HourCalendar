CREATE DATABASE IF NOT EXISTS hour
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE hour;

CREATE TABLE IF NOT EXISTS users (
    user_id       BIGINT       NOT NULL AUTO_INCREMENT,
    login_id      VARCHAR(50)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    email         VARCHAR(100) NOT NULL,
    nickname      VARCHAR(50)  NOT NULL,
    birth_date    DATE         NULL,
    profile_image VARCHAR(500) NULL,
    bg_image      VARCHAR(500) NULL,
    bg_color      VARCHAR(7)   NOT NULL DEFAULT '#111111',
    point_color   VARCHAR(7)   NOT NULL DEFAULT '#66FFFF',
    font          VARCHAR(30)  NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uk_users_login_id (login_id),
    UNIQUE KEY uk_users_email (email)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_verification (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    email       VARCHAR(100) NOT NULL,
    purpose     VARCHAR(20)  NOT NULL,
    code_hash   VARCHAR(100) NOT NULL,
    expires_at  DATETIME     NOT NULL,
    verified_at DATETIME     NULL,
    attempts    INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email_verification (email, purpose),
    CONSTRAINT ck_email_verification_purpose CHECK (purpose IN ('SIGNUP', 'FIND_ID', 'RESET_PASSWORD'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS friendship (
    friendship_id BIGINT      NOT NULL AUTO_INCREMENT,
    user_id       BIGINT      NOT NULL,
    friend_id     BIGINT      NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'REQUESTED',
    created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (friendship_id),
    UNIQUE KEY uk_friendship_pair (user_id, friend_id),
    KEY idx_friendship_friend (friend_id, status),
    KEY idx_friendship_cleanup (status, updated_at),
    CONSTRAINT fk_friendship_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_friendship_friend FOREIGN KEY (friend_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_friendship_self CHECK (user_id <> friend_id),
    CONSTRAINT ck_friendship_status CHECK (status IN ('REQUESTED', 'ACCEPTED', 'REJECTED', 'DELETED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room (
    room_id    BIGINT       NOT NULL AUTO_INCREMENT,
    room_code  VARCHAR(20)  NOT NULL,
    host_id    BIGINT       NOT NULL,
    room_title VARCHAR(100) NOT NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME     NULL,
    PRIMARY KEY (room_id),
    UNIQUE KEY uk_room_code (room_code),
    CONSTRAINT fk_room_host FOREIGN KEY (host_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_participant (
    room_id   BIGINT   NOT NULL,
    user_id   BIGINT   NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id BIGINT NULL,
    PRIMARY KEY (room_id, user_id),
    KEY idx_room_participant_user (user_id),
    CONSTRAINT fk_room_participant_room FOREIGN KEY (room_id) REFERENCES room (room_id) ON DELETE CASCADE,
    CONSTRAINT fk_room_participant_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedule (
    schedule_id     BIGINT        NOT NULL AUTO_INCREMENT,
    user_id         BIGINT        NOT NULL,
    room_id         BIGINT        NULL,
    title           VARCHAR(100)  NOT NULL,
    start_time      DATETIME      NOT NULL,
    end_time        DATETIME      NOT NULL,
    memo            VARCHAR(1000) NULL,
    is_secret       TINYINT(1)    NOT NULL DEFAULT 0,
    show_in_compare TINYINT(1)    NOT NULL DEFAULT 1,
    status          VARCHAR(20)   NOT NULL DEFAULT 'CONFIRMED',
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (schedule_id),
    KEY idx_schedule_user_time (user_id, start_time, end_time),
    KEY idx_schedule_room_status (room_id, status),
    CONSTRAINT fk_schedule_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_room FOREIGN KEY (room_id) REFERENCES room (room_id) ON DELETE SET NULL,
    CONSTRAINT ck_schedule_time CHECK (end_time > start_time),
    CONSTRAINT ck_schedule_status CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedule_member (
    schedule_id  BIGINT      NOT NULL,
    user_id      BIGINT      NOT NULL,
    status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    responded_at DATETIME    NULL,
    PRIMARY KEY (schedule_id, user_id),
    KEY idx_schedule_member_user (user_id, status),
    CONSTRAINT fk_schedule_member_schedule FOREIGN KEY (schedule_id) REFERENCES schedule (schedule_id) ON DELETE CASCADE,
    CONSTRAINT fk_schedule_member_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_schedule_member_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification (
    notification_id BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         BIGINT       NOT NULL,
    noti_type       VARCHAR(30)  NOT NULL,
    ref_id          BIGINT       NULL,
    message         VARCHAR(500) NOT NULL,
    is_read         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    KEY idx_notification_user_read (user_id, is_read, created_at),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT ck_notification_type CHECK (noti_type IN ('FRIEND_REQUEST', 'SCHEDULE_INVITE', 'SCHEDULE_CANCELED'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS todo (
    todo_id    BIGINT       NOT NULL AUTO_INCREMENT,
    user_id    BIGINT       NOT NULL,
    todo_date  DATE         NOT NULL,
    content    VARCHAR(200) NOT NULL,
    done       TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (todo_id),
    KEY idx_todo_user_date (user_id, todo_date, sort_order),
    CONSTRAINT fk_todo_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_message (
    message_id BIGINT        NOT NULL AUTO_INCREMENT,
    room_id    BIGINT        NOT NULL,
    user_id    BIGINT        NULL,
    msg_type   VARCHAR(20)   NOT NULL DEFAULT 'TEXT',
    content    VARCHAR(1000) NOT NULL,
    ref_id     BIGINT        NULL,
    start_time DATETIME      NULL,
    end_time   DATETIME      NULL,
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (message_id),
    KEY idx_room_message_room (room_id, message_id),
    CONSTRAINT fk_room_message_room FOREIGN KEY (room_id) REFERENCES room (room_id) ON DELETE CASCADE,
    CONSTRAINT fk_room_message_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE SET NULL,
    CONSTRAINT ck_room_message_type CHECK (msg_type IN ('TEXT', 'SYSTEM', 'INVITE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- 로그인 세션 (Spring Session JDBC). 서버를 다시 시작해도 로그인이 유지되도록 세션을 DB에 저장한다.
CREATE TABLE IF NOT EXISTS SPRING_SESSION (
    PRIMARY_ID            CHAR(36)     NOT NULL,
    SESSION_ID            CHAR(36)     NOT NULL,
    CREATION_TIME         BIGINT       NOT NULL,
    LAST_ACCESS_TIME      BIGINT       NOT NULL,
    MAX_INACTIVE_INTERVAL INT          NOT NULL,
    EXPIRY_TIME           BIGINT       NOT NULL,
    PRINCIPAL_NAME        VARCHAR(100) NULL,
    CONSTRAINT SPRING_SESSION_PK PRIMARY KEY (PRIMARY_ID),
    UNIQUE KEY SPRING_SESSION_IX1 (SESSION_ID),
    KEY SPRING_SESSION_IX2 (EXPIRY_TIME),
    KEY SPRING_SESSION_IX3 (PRINCIPAL_NAME)
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS SPRING_SESSION_ATTRIBUTES (
    SESSION_PRIMARY_ID CHAR(36)     NOT NULL,
    ATTRIBUTE_NAME     VARCHAR(200) NOT NULL,
    ATTRIBUTE_BYTES    BLOB         NOT NULL,
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_PK PRIMARY KEY (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    CONSTRAINT SPRING_SESSION_ATTRIBUTES_FK FOREIGN KEY (SESSION_PRIMARY_ID) REFERENCES SPRING_SESSION (PRIMARY_ID) ON DELETE CASCADE
) ENGINE = InnoDB ROW_FORMAT = DYNAMIC DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
