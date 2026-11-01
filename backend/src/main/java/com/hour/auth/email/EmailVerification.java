package com.hour.auth.email;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class EmailVerification {

    private Long id;
    private String email;
    private EmailPurpose purpose;
    private String codeHash;
    private LocalDateTime expiresAt;
    private LocalDateTime verifiedAt;
    private int attempts;
    private LocalDateTime createdAt;
}
