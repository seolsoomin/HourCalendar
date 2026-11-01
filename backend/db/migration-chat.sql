USE hour;

ALTER TABLE room_participant ADD COLUMN IF NOT EXISTS last_read_message_id BIGINT NULL;

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
